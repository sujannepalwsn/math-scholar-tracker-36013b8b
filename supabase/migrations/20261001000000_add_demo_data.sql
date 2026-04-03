-- Create a Demo Center and Demo Admin for Sandbox Mode
DO $$
DECLARE
    new_center_id UUID := gen_random_uuid();
    demo_user_id UUID := gen_random_uuid();
    -- Bcrypt hash for 'demo1234' with 12 rounds
    password_hash TEXT := '$2b$12$5CQnyVtTr9Y7X1SNV9aW8eFbxzzajhbI8.gqtFboSQ3x9PrtvK3Oq';
BEGIN
    -- Check if demo center already exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo@eduflow.com') THEN
        -- Insert Center
        INSERT INTO centers (id, name, is_active, radius_meters, header_config)
        VALUES (new_center_id, 'Demo Academy', true, 100, '{"layout": "classic", "elements": []}');

        -- Insert User (role = center)
        INSERT INTO users (id, username, password_hash, role, center_id, is_active)
        VALUES (demo_user_id, 'demo@eduflow.com', password_hash, 'center', new_center_id, true);

        -- Add some dummy data to make the sandbox feel "alive"
        -- Add a few students
        INSERT INTO students (name, center_id, roll_number, gender, is_active)
        VALUES
            ('Alice Smith', new_center_id, 'S001', 'female', true),
            ('Bob Johnson', new_center_id, 'S002', 'male', true),
            ('Charlie Brown', new_center_id, 'S003', 'male', true);

        -- Add a teacher
        INSERT INTO teachers (name, center_id, is_active, hire_date)
        VALUES ('Sarah Jenkins', new_center_id, true, CURRENT_DATE);
    END IF;
END $$;
