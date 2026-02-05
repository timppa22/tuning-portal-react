-- Add ban_reason and ban_expires_at columns to users table
ALTER TABLE users
ADD COLUMN ban_reason TEXT NULL,
ADD COLUMN ban_expires_at TIMESTAMP NULL;

-- Create an index for ban_expires_at for better query performance
CREATE INDEX idx_users_ban_expires_at ON users(ban_expires_at);
