const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const knex = require('../config/database');

class AuthService {
  async registerUser(userData) {
    const { email, password, name } = userData;
    
    const existingUser = await knex('users')
      .where({ email })
      .first();

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [userId] = await knex('users')
      .insert({
        email,
        password: hashedPassword,
        name,
        created_at: knex.fn.now()
      });

    return this.generateToken(userId);
  }

  async loginUser(credentials) {
    const { email, password } = credentials;

    const user = await knex('users')
      .where({ email })
      .first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    return this.generateToken(user.id);
  }

  async generateResetToken(email) {
    const user = await knex('users')
      .where({ email })
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await knex('users')
      .where({ id: user.id })
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry
      });

    return resetToken;
  }

  async resetPassword(resetData) {
    const { email, token, newPassword } = resetData;

    const user = await knex('users')
      .where({
        email,
        reset_token: token,
      })
      .where('reset_token_expiry', '>', new Date())
      .first();

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await knex('users')
      .where({ id: user.id })
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        updated_at: knex.fn.now()
      });
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}

module.exports = new AuthService();