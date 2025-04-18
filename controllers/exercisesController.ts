import { Context } from 'hono';
import { supabase } from "../utils/supabaseClient.ts";
import { z } from "zod"

const ExerciseSchema = z.object({
    name: z.string(),
    sets: z.number().nonnegative(),
    reps: z.string(),
    weight: z.number().nonnegative(),
    date: z.string(),
    completed: z.boolean({
        required_error: "Completed is required",
        invalid_type_error: "completed must be a boolean",
    }),
    notes: z.string().optional()
});

export const getLatest = async(c: Context) => {
    const userId = c.req.param("userId");
    const exerciseName = c.req.param("exerciseName");
    console.log(exerciseName)
    try {
        const { data, error } = await supabase
            .from("exercises")
            .select("*")
            .eq("userid", userId)
            .eq("name", exerciseName)
            .eq("completed", true)
            .order("date", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return c.json({ error: "Exercise not found or no history available" }, 200);
        }

        const { sets, reps, weight, date, notes } = data;

        return c.json({
            name: exerciseName,
            sets,
            reps,
            weight,
            date,
            notes,
        });
    } catch (err) {
        return c.json({ error: err.message }, 400);
    }
}
export const getLastSevenDaysExercises = async (c: Context) => {
    const userId = c.req.param("userId")
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    try {
        const { data, error } = await supabase
            .from("exercises")
            .select("name, date, sets, reps, weight, notes")
            .eq("userid", userId)
            .gte("date", sevenDaysAgo.toISOString());

        if(data.length > 0){
            return c.json({ data }, 200);
        }
        return c.notFound()
    } catch (error) {
        return c.json({ error: error.message }, 400);
    }
};
export const getExercisesForToday = async (c: Context) => {
    const userId = c.req.param("userId");
    const date = c.req.param("date");

    try {
        const { data, error } = await supabase
            .from("exercises")
            .select("*")
            .eq("userid", userId)
            .eq("date", date);

        if (error) throw error;

        // Format to match the original KV-based shape
        const exercises = (data || []).map(exercise => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            notes: exercise.notes,
            completed: exercise.completed,
            date: exercise.date,
        }));

        return c.json(exercises);
    } catch (err) {
        return c.json({ error: err.message }, 400);
    }
}
export const upsertExercise = async (c: Context) => {
    const userId = c.req.param("userId");
    const body = await c.req.json();

    try {
        const exercise = ExerciseSchema.parse(body);
        const { data: existingExercise, error: fetchError } = await supabase
            .from("exercises")
            .select("*")
            .eq("userid", userId)
            .eq("name", exercise.name)
            .eq("date", exercise.date)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (!existingExercise) {
            // Insert new exercise record
            const { error: insertError } = await supabase
                .from("exercises")
                .insert([
                    {
                        userid: userId,
                        name: exercise.name,
                        sets: exercise.sets,
                        reps: exercise.reps,
                        weight: exercise.weight,
                        date: exercise.date,
                        completed: exercise.completed,
                        notes: exercise.notes || "",
                    },
                ])
                .select();

            if (insertError) throw insertError;
        } else {

            // Update existing record for same name + date
            const { error: updateError } = await supabase
                .from("exercises")
                .update({
                    sets: exercise.sets,
                    reps: exercise.reps,
                    weight: exercise.weight,
                    completed: exercise.completed,
                    notes: exercise.notes || "",
                })
                .eq("exerciseid", existingExercise.exerciseid);

            if (updateError) throw updateError;
            c.status(204)
            return c.body()
        }

        return c.json({ message: "Exercise recorded successfully" }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: error.errors }, 400);
        }
        return c.json({ error: error.message }, 400);
    }
}