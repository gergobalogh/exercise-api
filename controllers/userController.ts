import { Context } from 'hono';
import { supabase } from "../utils/supabaseClient.ts";
import { z } from "zod"


// const userSchema = z.object({
//     userid: z.number().int(),            // integer
//     name: z.string(),                    // character varying
//     age: z.number().int(),               // integer
//     height: z.number(),                  // double precision
//     weight: z.number(),                  // double precision
//     goal: z.string()                     // character varying
// });


export const addUser = async (c: Context) => {
    const username= c.req.param("name");
    const { data, error } = await supabase
        .from('users')
        .insert([
            { name: 'someValue', other_column: 'otherValue' },
        ])
        .select()
    if (error) throw error;
    return data;
};

export const updateUser = async (c: Context) => {

    const { data, error } = await supabase
        .from("users")
        // .update(parsed.data)
        // .eq("userid", userId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getUserByName = async (c: Context) => {
    const username = c.req.param("name");

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("name", username); // case-insensitive match

    if (error) {
        return c.json({ error: error.message }, 500);
    }
    return c.json(data);
};