import { Hono } from 'hono';
import {
    addUser,
    updateUser,
    getUserByName
} from '../controllers/userController.ts';

const userRoutes = new Hono();

userRoutes.post('/createUser', addUser);                      // Create a new user
userRoutes.put('/:userId', updateUser);             // Update an existing user
userRoutes.get('/name/:name', getUserByName);       // Get user(s) by name

export default userRoutes;