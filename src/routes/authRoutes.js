const express = require('express');
const AuthController = require('../controllers/authControllers');
const validateRequest = require('../middleware/validateRequest');
const {
  registerValidation,
  loginValidation,
  resetPasswordValidation
} = require('../middleware/authValidation');

function createRouter (dbType) {
  const router = express.Router();
  const authController = new AuthController(dbType);

  router.post('/register', registerValidation, validateRequest, authController.register);
  router.post('/login', loginValidation, validateRequest, authController.login);
  router.post('/forgot-password', authController.forgotPassword);
  router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);
  
  return router;
};

module.exports = createRouter;