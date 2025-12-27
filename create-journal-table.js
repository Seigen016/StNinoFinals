// Script to create the journal_entries table in Supabase
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const createTableSQL = `
-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  activities TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_teacher_id ON public.journal_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(date);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Teachers can view own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Teachers can insert own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Teachers can update own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Teachers can delete own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Admins can view all journal entries" ON public.journal_entries;

-- Create policies
CREATE POLICY "Teachers can view own journal entries"
  ON public.journal_entries
  FOR SELECT
  USING (teacher_id IN (SELECT id FROM public.users WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Teachers can insert own journal entries"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK (teacher_id IN (SELECT id FROM public.users WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Teachers can update own journal entries"
  ON public.journal_entries
  FOR UPDATE
  USING (teacher_id IN (SELECT id FROM public.users WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Teachers can delete own journal entries"
  ON public.journal_entries
  FOR DELETE
  USING (teacher_id IN (SELECT id FROM public.users WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Admins can view all journal entries"
  ON public.journal_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`

async function createTable() {
  console.log('🚀 Creating journal_entries table...\n')

  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: createTableSQL
    })

    if (error) {
      console.error('❌ Error creating table:', error.message)
      console.error('\nTrying alternative method...\n')
      
      // Try using raw SQL endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query_text: createTableSQL })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      console.log('✅ Table created successfully using alternative method!')
    } else {
      console.log('✅ Table created successfully!')
    }

    console.log('\n📋 Created:')
    console.log('  - journal_entries table')
    console.log('  - Indexes for performance')
    console.log('  - Row Level Security policies')
    console.log('  - Auto-update trigger for timestamps')
    console.log('\n🎉 Journal feature is now ready to use!')
    console.log('   Refresh your teacher page and try adding a journal entry.\n')

  } catch (error) {
    console.error('❌ Failed to create table:', error.message)
    console.error('\n📝 Alternative: Run this SQL manually in Supabase Dashboard:')
    console.error('   1. Go to https://supabase.com/dashboard')
    console.error('   2. Select your project')
    console.error('   3. Go to SQL Editor')
    console.error('   4. Run the SQL from: supabase_migration_journal_entries.sql\n')
    process.exit(1)
  }
}

createTable()
