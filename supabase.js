import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qmjjrbtjcmthxzwjhfwg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtampyYnRqY210aHh6d2poZndnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODcwNDEsImV4cCI6MjA4OTc2MzA0MX0.lG-xr_fv0TkHCxRrKDgOYbvYd1QtJgRh6Di-cs0ggZg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
