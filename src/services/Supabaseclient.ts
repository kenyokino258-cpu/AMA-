
import { createClient } from '@supabase/supabase-js';

// These should be set in your .env file
// REACT_APP_SUPABASE_URL=your-project-url
// REACT_APP_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = process.https://ogbqmanltdmpklysgnad.supabase.co || '';
const supabaseKey = process.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYnFtYW5sdGRtcGtseXNnbmFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTU0ODcsImV4cCI6MjA4MDY5MTQ4N30.NoavwB_lRQucv90xV3mdTS40kXS_icjrs71nCDEl8Qs || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
