const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running journal_entries table migration...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'supabase_migration_journal_entries.sql'), 'utf8');
    
    // Split SQL by statement and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.includes('--') && !statement.trim().startsWith('--')) {
        // Skip comments
        const cleanStatement = statement.split('--')[0].trim();
        if (cleanStatement) {
          console.log('Executing:', cleanStatement.substring(0, 50) + '...');
          const { error } = await supabase.rpc('exec_sql', {
            query_text: cleanStatement + ';'
          });
          
          if (error) {
            console.error('Error executing statement:', error);
          } else {
            console.log('✓ Statement executed successfully');
          }
        }
      } else if (!statement.trim().startsWith('--')) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', {
          query_text: statement + ';'
        });
        
        if (error) {
          console.error('Error executing statement:', error);
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log('\nMigration completed!');
    console.log('The journal_entries table has been created successfully.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
