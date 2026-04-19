-- ==========================================
-- SUPABASE SQL SCHEMA: VIRTUAL TRIBAL TOURISM
-- ==========================================

-- 1. DONATIONS TABLE
DROP TABLE IF EXISTS donations;
CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  donor_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  cause TEXT,
  message TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'verified'
);

-- 2. MEDIA TABLE
DROP TABLE IF EXISTS media;
CREATE TABLE media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, 
  type TEXT NOT NULL,      
  source_url TEXT NOT NULL, 
  thumbnail_url TEXT, 
  is_active BOOLEAN DEFAULT true
);

-- 3. SETTINGS TABLE
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  id TEXT PRIMARY KEY, 
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ADMIN LOGS
DROP TABLE IF EXISTS admin_logs;
CREATE TABLE admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  admin_action TEXT NOT NULL,
  details TEXT
);

-- 5. CONTACTS TABLE
DROP TABLE IF EXISTS contacts;
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'New'
);

-- 6. TESTIMONIALS TABLE
DROP TABLE IF EXISTS testimonials;
CREATE TABLE testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  photo_url TEXT DEFAULT 'https://ui-avatars.com/api/?name=User&background=random',
  content TEXT NOT NULL,
  status TEXT DEFAULT 'Approved'
);

-- RLS for testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public testimonials are viewable by everyone" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Anyone can insert testimonials" ON testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "Only authenticated delete testimonials" ON testimonials FOR DELETE USING (true);

-- ==========================================
-- SECURITY POLICIES (RLS)
-- ==========================================

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- SETTINGS: Public read, Admin write
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON settings FOR ALL USING (true);

-- DONATIONS: Public insert, Admin select
CREATE POLICY "Public insert donations" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin select donations" ON donations FOR SELECT USING (true);

-- MEDIA: Public read, Admin manage
CREATE POLICY "Public read media" ON media FOR SELECT USING (true);
CREATE POLICY "Admin manage media" ON media FOR ALL USING (true);

-- CONTACTS: Public insert, Admin select
CREATE POLICY "Public insert contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin select contacts" ON contacts FOR SELECT USING (true);

-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO settings (id, value) VALUES 
('upi_id', '8248678722@neys'),
('upi_name', 'Prasanth');

INSERT INTO media (title, category, type, source_url) VALUES 
('Traditional Welcome Dance', 'Rituals', 'YouTube Video', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('Iruliga Forest Music', 'Music', 'YouTube Video', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('Bamboo Rice Preparation', 'Food', 'YouTube Video', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
