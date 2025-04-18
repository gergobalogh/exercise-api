import { Context } from 'hono';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

export const generateWorkout = async (c: Context) => {
    try {
        const {previousWorkoutData, previousCardioData} = await c.req.json();
        const groupedByDate = {};
        previousWorkoutData?.forEach(w => {
            if (!groupedByDate[w.date]) groupedByDate[w.date] = [];
            groupedByDate[w.date].push(w);
        });
        const formattedGroupedData = Object.entries(groupedByDate).map(([date, workouts]) => {
            const dayExercises = workouts.map(w => `  - ${w.name}: ${w.sets}x${w.reps} @ ${w.weight}kg (${w.notes})`).join("\n");
            return `${date}:\n${dayExercises}`;
        }).join("\n");
        const formattedCardioData = previousCardioData?.map(cardio => {
            return ` ${cardio.date}: ${cardio.type} km in ${cardio.duration} min (Avg HR: ${cardio.avgHeartRate} bpm). Notes: ${cardio.notes}`
        }).join("\n");
        const workoutSystemPrompt =
            "You are a certified personal trainer and endurance coach specializing in triathlon prep. " +
            "Create clear, effective full-body strength workouts using simple gym equipment (kettlebells, dumbbells, barbells), followed by a running segment. " +
            "Use the previous week's data to ensure progressive overload, balance, and recovery."
        const workoutUserPrompt =
            `Based on the following previous weeks workout data:\n\n${formattedGroupedData}\n\n${formattedCardioData}\n\n` +
            "Give me a single full-body gym workout made up of multiple exercises using kettlebells, dumbbells, barbells, and other simple gym equipment. " +
            "Include sets, reps, and rest time. Keep it balanced and intense. End with one single cardio component that is fully executable in a gym setting (e.g., treadmill, rowing machine, bike, stairmaster). Use metric units (kilometers and minutes).. Do not include swimming or running drills.";

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {role: "system", content: workoutSystemPrompt},
                    {role: "user", content: workoutUserPrompt}
                ],
                temperature: 0.7
            })
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', options);
        const jsonResponse = await response.json();

        if (!response.ok) {
            console.error('OpenAI API error:', jsonResponse);
            return c.json({error: 'Failed to get workout from OpenAI', details: jsonResponse}, response.status);
        }

        const workout = jsonResponse.choices?.[0]?.message?.content || "No workout available.";
        return c.json({workout});

    } catch (error) {
        console.error('Server error:', error);
        return c.json({error: 'Internal server error', message: error.message}, 500);
    }
};

export const critiqueWorkout = async (c: Context) => {
    try {
        // Get the workout description from the request body
        const body = await c.req.json();
        const workoutDescription = body.workout;

        if (!workoutDescription) {
            return c.json({ error: "Workout description is required" }, 400);
        }

        // Prepare the OpenAI API request
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                "model": 'gpt-3.5-turbo',
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a certified strength and conditioning coach with expertise in triathlon training. Your job is to provide honest, constructive feedback on this workout, focusing on balance, safety, effectiveness, and appropriateness for triathlon preparation. Evaluate the progression from previous workouts, the exercise selection, volume, intensity, and recovery considerations. Suggest specific modifications if needed."
                    },
                    {
                        "role": "user",
                        "content": `Review the following workout plan and provide your professional assessment:\n\n'${workoutDescription}'\n\nProvide feedback in these categories:\n1. Overall Structure and Balance\n2. Safety Considerations\n3. Effectiveness for Triathlon Preparation\n4. Progression from Previous Data\n5. Specific Recommendations for Improvement. Ensure each section has a clear heading (e.g., Warm-up, Strength Training, Cardio Finisher, Cool-down) for easy parsing later into JSON.`
                    }
                ],
                "temperature": 0.7
            })
        };

        // Make the request to OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', options);
        const data = await response.json();

        // Return the OpenAI response
        return c.json(data.choices?.[0]?.message?.content || "No feedback available.");
    } catch (error) {
        console.error("Error processing request:", error);
        return c.json({ error: "Failed to process request" }, 500);
    }
};

export const optimizeWorkout = async (c: Context) => {
    try {
        const { workout, feedback } = await c.req.json();

        if (!workout || !feedback) {
            return c.json({ error: "Workout and feedback are required" }, 400);
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                "model": "gpt-4",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an elite personal trainer and strength coach with experience in triathlon training. You understand exercise programming, progression, and balance, and specialize in creating workouts that are clear, effective, and safe. Your expertise includes optimizing workouts based on professional feedback while maintaining the original intent."
                    },
                    {
                        "role": "user",
                        "content": `Here is a full-body workout: ${workout}\n\nHere is the critique and feedback on that workout: ${feedback}\n\nPlease revise the original workout based on the feedback to create the most optimal version. The revised workout should:\n1. Address all safety concerns raised in the feedback\n2. Maintain the full-body focus with improved balance\n3. Include clear sets, reps, weights (or guidance), and rest times\n4. Keep the workout intense but appropriate for triathlon training\n5. Include a proper warm-up sequence\n6. End with an optimized cardio component\n7. Include a cool-down routine\n\nFormat the workout with clear section headings and exercise instructions.`
                    }
                ],
                "temperature": 0.7
            })
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', options);

        if (!response.ok) {
            const errorData = await response.json();
            return c.json({ error: errorData }, response.status);
        }

        const data = await response.json();
        return c.json(data.choices?.[0]?.message?.content || "No ultimate workout available.");
    } catch (err) {
        console.error("Error:", err);
        return c.json({ error: err.message }, 500);
    }
};

export const workoutToJson = async (c: Context) => {
    try {
        const { workout } = await c.req.json();

        if (!workout) {
            return c.json({ error: "Workout is required" }, 400);
        }
        const workoutSchema = {
            "workout_name": "string",
            "warm_up": "string",
            "exercises": [
                {
                    "name": "string",
                    "sets": "number",
                    "reps": "string or number",
                    "rest": "string",
                    "description": "string"
                }
            ],
            "cardio": {
                "type": "string",
                "distance": "number",
                "duration": "string",
                "description": "string"
            },
            "cool_down": "string",
            "notes": "string"
        }
        const systemMessage = {
            role: "system",
            content: `You are a helpful and detail-oriented assistant that takes unstructured workout text and converts it into a well-formatted JSON object for easy parsing. Use the following JSON schema. Leave fields as empty strings or empty arrays if the information is not provided in the input:
            
            ${JSON.stringify(workoutSchema, null, 2)}`

        };
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                "model": "gpt-3.5-turbo",
                "messages": [

                    systemMessage,
                    {
                        "role": "user",
                        "content": `${workout}`
                    }
                ],
                "temperature": 0.7
            })
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', options);

        if (!response.ok) {
            const errorData = await response.json();
            return c.json({ error: errorData }, response.status);
        }

        const data = await response.json();
        return c.json(data.choices?.[0]?.message?.content || "No workout JSON available.");
    } catch (err) {
        console.error("Error:", err);
        return c.json({ error: err.message }, 500);
    }
};

export const getExerciseInstructions = async (c: Context) => {
    const exerciseName = c.req.query('exerciseName');

    if (!exerciseName) {
        return c.text("Error: No exercise name provided", 400);
    }

    try {
        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Provide a really short and concise instruction for the given gym exercise." },
                    { role: "user", content: `How do I perform ${exerciseName}?` },
                ],
                max_tokens: 100,
            }),
        });

        if (!openAiResponse.ok) {
            throw new Error(`OpenAI API error: ${openAiResponse.statusText}`);
        }

        const jsonResponse = await openAiResponse.json();
        const instruction = jsonResponse.choices?.[0]?.message?.content || "No instruction available.";

        return c.json(
            { exercise: exerciseName, instruction },
            200
        );
    } catch (error) {
        console.error("Error generating exercise instruction:", error);
        return c.json({ error: "Failed to fetch exercise instructions." }, 500);
    }
}