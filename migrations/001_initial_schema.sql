-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(100),
    email_verified BOOLEAN DEFAULT false,
    subscription VARCHAR(20) DEFAULT 'free',
    avatar VARCHAR(255),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    settings JSONB,
    hwid VARCHAR(255),
    CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id)
);

-- Create license_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS license_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    product VARCHAR(50) NOT NULL,
    duration_days INTEGER NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT
);

-- Create client_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS client_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    download_url TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(key);
CREATE INDEX IF NOT EXISTS idx_license_keys_used_by ON license_keys(used_by);
CREATE INDEX IF NOT EXISTS idx_license_keys_product ON license_keys(product);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_hwid ON users(hwid);
