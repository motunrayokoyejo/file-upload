const { body } = require('express-validator');

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail(),
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 })
];

module.exports = {
  registerValidation,
  loginValidation,
  resetPasswordValidation
};