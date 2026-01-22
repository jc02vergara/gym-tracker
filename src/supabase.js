import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://azsiafacdbcsjuszjxbk.supabase.co";
const supabaseKey = "sb_publishable_ooQAmOr9huN9w-etDCpbMQ_g17aVYOA";

export const supabase = createClient(supabaseUrl, supabaseKey);
