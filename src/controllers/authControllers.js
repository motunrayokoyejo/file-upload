const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const token = await authService.registerUser(req.body);
      res.status(201).json({
        message: 'User registered successfully',
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(error.message === 'User already exists' ? 409 : 500).json({
        message: error.message || 'Internal server error'
      });
    }
  }

  async login(req, res) {
    try {
      const token = await authService.loginUser(req.body);
      res.json({
        message: 'Login successful',
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        message: error.message || 'Internal server error'
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const resetToken = await authService.generateResetToken(req.body.email);
      res.json({
        message: 'Password reset token generated',
        resetToken
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(error.message === 'User not found' ? 404 : 500).json({
        message: error.message || 'Internal server error'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      await authService.resetPassword(req.body);
      res.json({
        message: 'Password reset successful'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({
        message: error.message || 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();