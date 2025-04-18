import { Hono } from 'hono'
import { cors } from 'hono/cors'
import workoutRoutes from "./routes/workoutRoutes.ts";
import exerciseRoutes from "./routes/exerciseRoutes.ts";
import cardioRoutes from "./routes/cardioRoutes.ts";
import userRoutes from "./routes/userRoutes.ts";

const app = new Hono();

// Apply CORS middleware
app.use(
    "/*",
    cors({
        origin: ["http://localhost:63343", "https://exercise-ha7t.onrender.com", "http://localhost:63342"],
        allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests", "Content-Type"],
        allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
        exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
        maxAge: 600,
        credentials: true,
    })
);
app.route('/workout', workoutRoutes);
app.route('/exercises', exerciseRoutes)
app.route('/cardio', cardioRoutes)
app.route('/user', userRoutes)


const port = 8000;
Deno.serve({ port }, app.fetch);
