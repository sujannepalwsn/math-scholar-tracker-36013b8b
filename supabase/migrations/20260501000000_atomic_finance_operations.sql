-- Atomic RPC to record a payment and update the associated invoice
CREATE OR REPLACE FUNCTION record_invoice_payment(
  p_invoice_id UUID,
  p_amount NUMERIC,
  p_payment_date DATE,
  p_payment_method TEXT,
  p_reference_number TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_total_amount NUMERIC;
  v_new_paid_amount NUMERIC;
BEGIN
  -- 1. Insert the payment record
  INSERT INTO public.payments (
    invoice_id,
    amount,
    payment_date,
    payment_method,
    reference_number
  ) VALUES (
    p_invoice_id,
    p_amount,
    p_payment_date,
    p_payment_method,
    p_reference_number
  );

  -- 2. Update the invoice atomically
  -- We use a locked UPDATE to ensure no other process interferes with the balance calculation
  UPDATE public.invoices
  SET
    paid_amount = COALESCE(paid_amount, 0) + p_amount,
    updated_at = NOW(),
    status = CASE
      WHEN (COALESCE(paid_amount, 0) + p_amount) >= total_amount THEN 'paid'
      WHEN (COALESCE(paid_amount, 0) + p_amount) > 0 THEN 'partial'
      ELSE status
    END
  WHERE id = p_invoice_id
  RETURNING paid_amount INTO v_new_paid_amount;

  -- Optional: Log the transition for audit purposes
  RAISE NOTICE 'Invoice % updated. New paid amount: %', p_invoice_id, v_new_paid_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
