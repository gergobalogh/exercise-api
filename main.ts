import { Hono } from 'https://deno.land/x/hono@v3.10.2/mod.ts';
import { cors } from 'https://deno.land/x/hono@v3.10.2/middleware.ts';
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

if (!OPENAI_API_KEY) {
  console.error("Missing OpenAI API key.");
  Deno.exit(1);
}
const app = new Hono();

// Apply CORS middleware
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:63343", "https://exercise-ha7t.onrender.com", "http://localhost:63342"],
    allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests", "Content-Type"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  })
);
app.get('/api/generate-workout', async (c) => {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        "model": "gpt-3.5-turbo",
        "messages": [
          {
            "role": "system",
            "content": "You are a certified personal trainer who gives clear, concise, and effective workout recommendations. Your client wants to get in shape and finish a thriathlon."
          },
          {
            "role": "user",
            "content": "Give me a single full-body gym workout made up of multiple exercises using kettlebells, dumbbells, barbells, and other simple gym equipment. Include sets, reps, and rest time. Keep it balanced and intense."
          }
        ],
        "temperature": 0.7
      })
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', options);
    const jsonResponse = await response.json()
    const workout = jsonResponse.choices?.[0]?.message?.content || "No workout available.";
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return c.json({ error: 'Failed to get workout from OpenAI', details: errorData }, response.status);
    }
    
    return c.json(workout);
  } catch (error) {
    console.error('Server error:', error);
    return c.json({ error: 'Internal server error', message: error.message }, 500);
  }
});
app.post("/api/critique-workout", async (c) => {
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
        "model": "gpt-4",
        "messages": [
          {
            "role": "system",
            "content": "You are a certified strength and conditioning coach. Your job is to provide honest, constructive feedback on workout programming—focusing on balance, safety, effectiveness, and clarity."
          },
          {
            "role": "user",
            "content": `Please critique the following workout: '${workoutDescription}'`
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
});
app.post("/api/workout-optimization", async (c) => {
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
            "content": "You are an elite personal trainer and strength coach. You understand exercise programming, progression, and balance, and can write workouts that are clear, effective, and safe."
          },
          {
            "role": "user",
            "content": `Here is a full-body workout: ${workout}\n\nHere is the critique and feedback on that workout: ${feedback}\n\nPlease revise the original workout based on the feedback to create the most optimal version of it possible. Keep it well-rounded and intense, with sets, reps, and rest times clearly defined.`
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
});
app.post("/api/workout-to-json", async (c) => {
  try {
    const { workout } = await c.req.json();
    
    if (!workout) {
      return c.json({ error: "Workout is required" }, 400);
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
            "content": "You are a helpful assistant that takes workout text and converts it into a well-structured JSON format for easy parsing. Use the following JSON structure:\n\n{\n  \"workout_name\": string,\n  \"warm_up\": string,\n  \"cool_down\": string,\n  \"exercises\": [\n    {\n      \"name\": string,\n      \"sets\": number,\n      \"reps\": string or number,\n      \"rest\": string,\n      \"description\": string\n    }\n  ],\n  \"notes\": string\n}"
          },
    
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
});

app.get('/api/getinstructions', async (c) => {
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
      200,
      {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
        "Content-Type": "application/json",
      },
    );
  } catch (error) {
    console.error("Error generating exercise instruction:", error);
    return c.json({ error: "Failed to fetch exercise instructions." }, 500);
  }
});

// Start the server
const port = 8000;
Deno.serve({ port }, app.fetch);
console.log(`Server is running on http://localhost:${port}`);