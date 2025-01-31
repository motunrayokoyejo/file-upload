const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserRepository = require('../repository/user');

class AuthService {
  constructor(dbType) {
    this.userRepository = new UserRepository(dbType);
  }
  async registerUser(userData) {
    const { email, password, name } = userData;
    
    const existingUser = await this.userRepository.findUser(email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userId = await this.userRepository.createUser({
      email,
      password: hashedPassword,
      name
    });

    return this.generateToken(userId);
  }

  async loginUser(credentials) {
    const { email, password } = credentials;

    const user = await this.userRepository.findUser(email);

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
    const user = await this.userRepository.findUser(email);

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.userRepository.updateUser({ id: user.id }, {
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    return resetToken;
  }

  async resetPassword(resetData) {
    const { email, token, newPassword } = resetData;

    const user = await this.userRepository.findOne({ email, reset_token: token, reset_token_expiry: { $gt: new Date() } });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userRepository.updateUser({ id: user.id }, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
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

module.exports = AuthService;