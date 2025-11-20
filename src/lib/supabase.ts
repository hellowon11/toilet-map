import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xzecbilcpuiulkcrrsol.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZWNiaWxjcHVpdWxrY3Jyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MjAwOTEsImV4cCI6MjA3OTE5NjA5MX0.ddo0jZs6aWKL3stnig1oooGzlFtVBKpwwxudDeNaBOE";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
