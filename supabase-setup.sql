-- Create the clipboards table in Supabase
CREATE TABLE IF NOT EXISTS clipboards (
    id BIGSERIAL PRIMARY KEY,
    share_code TEXT UNIQUE NOT NULL,
    view_code TEXT UNIQUE NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_edit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_at TIMESTAMP WITH TIME ZONE,
    access_type TEXT DEFAULT 'edit' CHECK (access_type IN ('edit', 'view', 'private')),
    is_editable BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clipboards_share_code ON clipboards(share_code);
CREATE INDEX IF NOT EXISTS idx_clipboards_view_code ON clipboards(view_code);
CREATE INDEX IF NOT EXISTS idx_clipboards_expiry_at ON clipboards(expiry_at);

-- Enable Row Level Security (RLS)
ALTER TABLE clipboards ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for this demo)
-- In production, you might want more restrictive policies
CREATE POLICY "Allow all operations" ON clipboards
    FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_clipboards_updated_at 
    BEFORE UPDATE ON clipboards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a function to clean up expired clipboards
CREATE OR REPLACE FUNCTION cleanup_expired_clipboards()
RETURNS void AS $$
BEGIN
    DELETE FROM clipboards 
    WHERE expiry_at IS NOT NULL 
    AND expiry_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- You can run this function periodically or manually:
-- SELECT cleanup_expired_clipboards(); 