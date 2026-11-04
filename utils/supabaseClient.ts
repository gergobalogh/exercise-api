import { createClient } from "@supabase/supabase-js";
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_KEY");
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Log an AI request into the 'ai_requests' table.
 * @param request_type - One of the ENUM types (e.g., 'generate-workout')
 * @param input_data - Raw input (JS object, will be stored as JSONB)
 * @param output_data - AI-generated result (string)
 */
export async function logAIRequest(
    request_type: 'generate-workout' | 'critique-workout' | 'workout-optimization' | 'workout-to-json',
    input_data: Record<string, any>,
    output_data: string
) {
    const { error } = await supabase
        .from('ai_requests')
        .insert([{ request_type, input_data, output_data }]);

    if (error) {
        console.error('Supabase insert error:', error);
    }
}

/**
 * Get the latest saved AI request for a specific endpoint type.
 * Useful for frontend testing without triggering the OpenAI API.
 *
 * @param request_type - One of the ENUM types
 * @returns The most recent request (input + output)
 */
export async function getLatestAIRequest(
    request_type: 'generate-workout' | 'critique-workout' | 'workout-optimization' | 'workout-to-json'
) {
    const { data, error } = await supabase
        .from('ai_requests')
        .select('*')
        .eq('request_type', request_type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(); // Return just one object instead of array

    if (error) {
        console.error(`Error fetching latest ${request_type} request:`, error);
        return null;
    }

    return data;
}