const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const validateRequest = require('../middleware/validateRequest');
const {
  registerValidation,
  loginValidation,
  resetPasswordValidation
} = require('../middleware/authValidation');

router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);

module.exports = router;