-- Supabase SQL Schema for Khmer1 Lesson Plan Generator
-- Execute this script in your Supabase Project -> SQL Editor

-- 1. Create table for users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gender TEXT DEFAULT 'ប្រុស',
    role TEXT DEFAULT 'គ្រូបង្រៀន',
    phone TEXT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    ppt_count INTEGER DEFAULT 0,
    daily_ai_gen_count INTEGER DEFAULT 0,
    last_ai_gen_date TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create table for lesson plans
CREATE TABLE IF NOT EXISTS public.lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subject TEXT,
    lesson_no TEXT,
    lesson_title TEXT,
    teacher_name TEXT,
    class_in_charge TEXT,
    date TEXT,
    duration_detail TEXT,
    source_book TEXT,
    objectives TEXT,
    materials TEXT,
    attachment_text TEXT,
    activities JSONB DEFAULT '[]'::jsonb,
    attachment_images JSONB DEFAULT '[]'::jsonb,
    created_by TEXT DEFAULT 'anonymous',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (Allow read/write access for public anon key)
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow public read lesson_plans" ON public.lesson_plans FOR SELECT USING (true);
CREATE POLICY "Allow public insert lesson_plans" ON public.lesson_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update lesson_plans" ON public.lesson_plans FOR UPDATE USING (true);
CREATE POLICY "Allow public delete lesson_plans" ON public.lesson_plans FOR DELETE USING (true);

-- 5. Seed default demo users if table is empty
INSERT INTO public.users (name, gender, role, phone, username, password, word_count, ppt_count)
VALUES 
    ('អ្នកគ្រប់គ្រង (Admin)', 'ប្រុស', 'នាយក', '092920920', 'admin', 'password', 15, 8),
    ('គ្រូបង្រៀន ទី១', 'ស្រី', 'គ្រូបង្រៀន', '012112233', 'teacher1', 'password', 2, 0),
    ('គ្រូបង្រៀន ទី២', 'ស្រី', 'គ្រូបង្រៀន', '097555666', 'teacher2', 'password', 0, 1)
ON CONFLICT (username) DO NOTHING;
