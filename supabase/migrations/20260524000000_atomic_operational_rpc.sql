-- Atomic Operational RPCs for Inventory and Library
-- Date: 2026-05-24

CREATE OR REPLACE FUNCTION public.distribute_consumable_securely(
    p_center_id UUID,
    p_consumable_id UUID,
    p_recipient_type TEXT, -- 'student' or 'teacher'
    p_recipient_id UUID,
    p_amount NUMERIC,
    p_notes TEXT
)
RETURNS void AS $$
DECLARE
    v_unit_price NUMERIC;
    v_item_name TEXT;
    v_invoice_id UUID;
    v_total_amount NUMERIC;
BEGIN
    -- Security check: Ensure the user belongs to the center
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND center_id = p_center_id) THEN
        RAISE EXCEPTION 'Unauthorized: User does not belong to the specified center';
    END IF;

    -- Get item details and verify it belongs to the center
    SELECT unit_price, name INTO v_unit_price, v_item_name
    FROM public.consumables
    WHERE id = p_consumable_id AND center_id = p_center_id;

    IF v_item_name IS NULL THEN
        RAISE EXCEPTION 'Consumable not found or does not belong to this center';
    END IF;

    -- 1. Atomic stock decrement
    UPDATE public.consumables
    SET current_stock = current_stock - p_amount,
        updated_at = NOW()
    WHERE id = p_consumable_id AND center_id = p_center_id AND current_stock >= p_amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock or item not found';
    END IF;

    -- 2. Insertion of the log entry
    INSERT INTO public.consumable_logs (
        center_id,
        consumable_id,
        student_id,
        teacher_id,
        quantity,
        action_type,
        notes
    ) VALUES (
        p_center_id,
        p_consumable_id,
        CASE WHEN p_recipient_type = 'student' THEN p_recipient_id ELSE NULL END,
        CASE WHEN p_recipient_type = 'teacher' THEN p_recipient_id ELSE NULL END,
        p_amount,
        'distributed',
        p_notes
    );

    -- 3. Creation of the student invoice (if applicable)
    IF p_recipient_type = 'student' AND v_unit_price > 0 THEN
        v_total_amount := v_unit_price * p_amount;

        INSERT INTO public.invoices (
            center_id,
            student_id,
            total_amount,
            status,
            invoice_date,
            invoice_number,
            notes
        ) VALUES (
            p_center_id,
            p_recipient_id,
            v_total_amount,
            'unpaid',
            CURRENT_DATE,
            'INV-CONS-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0'),
            'Purchase: ' || v_item_name || ' x ' || p_amount
        ) RETURNING id INTO v_invoice_id;

        INSERT INTO public.invoice_items (
            invoice_id,
            description,
            quantity,
            unit_amount,
            total_amount
        ) VALUES (
            v_invoice_id,
            v_item_name || ' x ' || p_amount,
            p_amount,
            v_unit_price,
            v_total_amount
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.issue_book_securely(
    p_center_id UUID,
    p_book_id UUID,
    p_student_id UUID,
    p_due_date DATE
)
RETURNS void AS $$
BEGIN
    -- Security check: Ensure the user belongs to the center
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND center_id = p_center_id) THEN
        RAISE EXCEPTION 'Unauthorized: User does not belong to the specified center';
    END IF;

    -- 1. Decrement available copies
    UPDATE public.books
    SET available_copies = available_copies - 1,
        updated_at = NOW()
    WHERE id = p_book_id AND center_id = p_center_id AND available_copies > 0;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No copies available or book not found';
    END IF;

    -- 2. Record Loan
    INSERT INTO public.book_loans (
        center_id,
        book_id,
        student_id,
        issue_date,
        due_date,
        status
    ) VALUES (
        p_center_id,
        p_book_id,
        p_student_id,
        CURRENT_DATE,
        p_due_date,
        'Issued'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
