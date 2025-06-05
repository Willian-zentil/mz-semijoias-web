import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovrvveqpummunoecfgkr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92cnZ2ZXFwdW1tdW5vZWNmZ2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTgwMDIsImV4cCI6MjA2MzE3NDAwMn0.CRAM8OTGj86nqNHBzd1A9tV30QqXN9LfWn_QfvjVYZM'; // Substitua pela anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);