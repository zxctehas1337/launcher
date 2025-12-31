-- Add description column to client_versions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'client_versions'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE client_versions 
        ADD COLUMN description TEXT;
        
        -- Set default description for existing rows
        UPDATE client_versions 
        SET description = 'Версия клиента'
        WHERE description IS NULL;
    END IF;
END $$;
