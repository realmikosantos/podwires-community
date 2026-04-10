const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be 2-100 characters'),
    body('role')
      .optional()
      .isIn(['producer', 'client'])
      .withMessage('Role must be producer or client'),
    validate,
  ],
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate,
  ],
  authController.login
);

router.post('/refresh', authController.refreshToken);

router.post('/logout', authController.logout);

// WordPress SSO endpoint
router.get('/sso', authController.sso);

router.get('/me', authenticate, authController.getMe);

module.exports = router;
