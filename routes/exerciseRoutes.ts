import {Hono} from 'hono';
import {
    getLastSevenDaysExercises,
    getLatest, getExercisesForToday,
    upsertExercise
} from '../controllers/exercisesController.ts';

const exerciseRoutes = new Hono();

exerciseRoutes.get('/:userId/:exerciseName/latest', getLatest)
exerciseRoutes.get('/:userId/date/last-seven-days', getLastSevenDaysExercises);
exerciseRoutes.get('/:userId/date/:date', getExercisesForToday)
exerciseRoutes.post('/:userId', upsertExercise)

export default exerciseRoutes;
