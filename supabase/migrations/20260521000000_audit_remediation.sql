-- Optimization for Admin Analytics N+1 problem
CREATE OR REPLACE VIEW center_analytics_view AS
SELECT
    c.*,
    (SELECT count(*)::int FROM students s WHERE s.center_id = c.id) as students_count,
    (SELECT count(*)::int FROM teachers t WHERE t.center_id = c.id) as teachers_count,
    (SELECT count(*)::int FROM users u WHERE u.center_id = c.id AND u.role = 'parent') as parents_count,
    (SELECT count(*)::int FROM users u WHERE u.center_id = c.id AND u.last_active_at >= (NOW() - INTERVAL '15 minutes')) as active_now_count
FROM centers c;

-- Atomic inventory updates to prevent race conditions
CREATE OR REPLACE FUNCTION decrement_consumable_stock(item_id UUID, amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE consumables
    SET current_stock = current_stock - amount,
        updated_at = NOW()
    WHERE id = item_id AND current_stock >= amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock or item not found';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_consumable_stock(item_id UUID, amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE consumables
    SET current_stock = current_stock + amount,
        updated_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_book_copies(row_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = row_id AND available_copies > 0;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No copies available or book not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_available_copies(row_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE books
    SET available_copies = LEAST(available_copies + 1, total_copies)
    WHERE id = row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_center_id ON users(center_id);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_students_center_id ON students(center_id);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

CREATE INDEX IF NOT EXISTS idx_teachers_center_id ON teachers(center_id);
CREATE INDEX IF NOT EXISTS idx_teachers_is_active ON teachers(is_active);

CREATE INDEX IF NOT EXISTS idx_consumables_center_id ON consumables(center_id);
CREATE INDEX IF NOT EXISTS idx_books_center_id ON books(center_id);

CREATE INDEX IF NOT EXISTS idx_book_loans_center_id ON book_loans(center_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_book_id ON book_loans(book_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_student_id ON book_loans(student_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_status ON book_loans(status);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_center_id ON chat_conversations(center_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_parent_user_id ON chat_conversations(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_read ON chat_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_user_id ON chat_messages(sender_user_id);

CREATE INDEX IF NOT EXISTS idx_invoices_center_id ON invoices(center_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
