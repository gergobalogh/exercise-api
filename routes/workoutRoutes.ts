import { Hono } from 'hono';
import {
    generateWorkout,
    critiqueWorkout,
    optimizeWorkout,
    workoutToJson,
    getExerciseInstructions,
} from '../controllers/workoutController.ts';

const workoutRoutes = new Hono();

workoutRoutes.post('/generate-workout', generateWorkout);
workoutRoutes.post('/critique-workout', critiqueWorkout);
workoutRoutes.post('/workout-optimization', optimizeWorkout);
workoutRoutes.post('/workout-to-json', workoutToJson);
workoutRoutes.get('/getinstructions', getExerciseInstructions);

export default workoutRoutes;
