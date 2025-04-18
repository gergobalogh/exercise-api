import { Context } from 'hono';
import { supabase } from "../utils/supabaseClient.ts";
import { z } from "zod"


const CardioTypeEnum = z.enum(["running", "indoor rowing", "stair stepper", "indoor bicycle"]);

const CardioExerciseSchema = z.object({
    type: CardioTypeEnum,
    duration: z.number().positive(), // in minutes
    distance: z.number().positive().optional(), // in miles or km
    date: z.string(),
    notes: z.string().optional()
});
export const getCardioByUser = async (c: Context) => {
    const userId = c.req.param("userId");

    try {
        const { data, error } = await supabase
            .from("cardio")
            .select("*")
            .eq("userid", userId)
            .order("date", { ascending: false });

        if (error) throw error;

        return c.json(data);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
}
export const getCardioForLastSevenDays = async (c: Context) => {
    const userId = c.req.param("userId");

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    try {
        //@TODO WHERE completed = true
        const { data, error } = await supabase
            .from("cardioexercises")
            .select("*")
            .eq("userid", userId)
            .gte("date", sevenDaysAgo.toISOString().split("T")[0]) // format YYYY-MM-DD
            .lte("date", today.toISOString().split("T")[0])
            .order("date", { ascending: false });

        if (error) throw error;

        // Shape each entry to include `type` and details like in the original
        const cardioExercises = (data || []).map(entry => ({
            type: entry.type,
            date: entry.date,
            duration: entry.duration,
            distance: entry.distance,
            notes: entry.notes,
        }));

        return c.json(cardioExercises);
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
}
export const upsertCardio = async (c: Context) => {
    const userId = c.req.param("userId");
    const body = await c.req.json();

    try {
        const cardio = CardioExerciseSchema.parse(body);

        // Check if this user already has a cardio entry of this type on the same date
        const { data: existingEntry, error: fetchError } = await supabase
            .from("cardio")
            .select("*")
            .eq("userid", userId)
            .eq("type", cardio.type)
            .eq("date", cardio.date)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (!existingEntry) {
            // Insert new cardio record
            const { error: insertError } = await supabase
                .from("cardio")
                .insert([{
                    userid: userId,
                    type: cardio.type,
                    date: cardio.date,
                    duration: cardio.duration,
                    distance: cardio.distance,
                    completed: cardio.completed,
                    notes: cardio.notes || "",
                }]);

            if (insertError) throw insertError;
        } else {
            // Update existing record for that type and date
            const { error: updateError } = await supabase
                .from("cardio")
                .update({
                    duration: cardio.duration,
                    distance: cardio.distance,
                    completed: cardio.completed,
                    notes: cardio.notes || existingEntry.notes || "",
                })
                .eq("id", existingEntry.id); // assuming `id` is the PK

            if (updateError) throw updateError;
        }

        return c.json({ message: "Cardio exercise recorded successfully" }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: error.errors }, 400);
        }
        return c.json({ error: error.message }, 400);
    }
}