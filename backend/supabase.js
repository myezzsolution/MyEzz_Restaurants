import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    return false;
  }
}
