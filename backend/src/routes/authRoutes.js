import { Router } from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import { authOpcional } from '../middlewares/auth.js';
import * as authController from '../controllers/authController.js';

const router = Router();

router.post('/registrar', authOpcional, asyncHandler(authController.registrar));
router.post('/login', asyncHandler(authController.login));

export default router;
