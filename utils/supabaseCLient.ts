import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://begcfaxvjbeizhacrzft.supabase.co";
//@TODO this must be resolved via key.
const supabaseKey = "REMOVED_SUPABASE_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);