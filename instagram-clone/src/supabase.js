import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpbrletjlzokvopkladc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwYnJsZXRqbHpva3ZvcGtsYWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2OTc0MjQsImV4cCI6MjA3ODI3MzQyNH0.SsSZZuQ-j1v9pMiOxdEfOY81xMv5UOM6fluJQrkpHrQ';

export const supabase = createClient(supabaseUrl, supabaseKey);