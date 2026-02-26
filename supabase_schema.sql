-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'respondent', -- 'admin', 'creator', 'respondent'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Surveys Table
CREATE TABLE IF NOT EXISTS surveys (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_th TEXT,
    description TEXT,
    description_th TEXT,
    creator_id TEXT REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'closed'
    questions JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create Responses Table
CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    survey_id TEXT REFERENCES surveys(id) ON DELETE CASCADE,
    respondent_id TEXT REFERENCES users(id),
    respondent_name TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_time INTEGER -- in seconds
);

-- 4. Create Logs Table
CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Sessions Table (replaces localStorage for security)
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- 6. Create File Uploads Table
CREATE TABLE IF NOT EXISTS file_uploads (
    id TEXT PRIMARY KEY,
    response_id TEXT REFERENCES responses(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    storage_path TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended
-- For now, we will allow all access to keep it simple as requested,
-- but normally you would restrict this.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Simple "Allow All" policies for initial setup (Security can be hardened later)
CREATE POLICY "Allow All Users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Surveys" ON surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Responses" ON responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Logs" ON logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All FileUploads" ON file_uploads FOR ALL USING (true) WITH CHECK (true);

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
