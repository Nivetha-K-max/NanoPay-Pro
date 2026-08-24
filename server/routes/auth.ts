import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { isSafeString, SAFE_STRING_MSG, NAME_PATTERN, NAME_MSG } from '../security/validators.js';

const router = express.Router();

router.post(
  '/register',
  validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
    body('firstName')
      .notEmpty().withMessage('First name is required'),
    body('lastName')
      .notEmpty().withMessage('Last name is required'),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address'),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/profile', authMiddleware, getProfile);

export default router;
