-- Add created_at column to client_versions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'client_versions'
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE client_versions 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        
        -- Update existing rows to have current timestamp
        UPDATE client_versions 
        SET created_at = CURRENT_TIMESTAMP 
        WHERE created_at IS NULL;
    END IF;
END $$;
