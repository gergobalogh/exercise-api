import { Hono } from 'hono';
import {getCardioByUser, getCardioForLastSevenDays, upsertCardio} from "../controllers/cardioController.ts";

const cardioRoutes = new Hono();

cardioRoutes.get('/:userId', getCardioByUser)
cardioRoutes.get('/:userId/date/last-seven-days', getCardioForLastSevenDays)
cardioRoutes.post('/:userId', upsertCardio)

export default cardioRoutes;