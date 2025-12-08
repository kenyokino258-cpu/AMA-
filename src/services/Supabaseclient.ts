
import { createClient } from '@supabase/supabase-js';

// These should be set in your .env file
// REACT_APP_SUPABASE_URL=your-project-url
// REACT_APP_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
