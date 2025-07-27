const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const helpers = {
  generateId: () => uuidv4(),
  
  hashPassword: async (password) => {
    return await bcrypt.hash(password, 10);
  },
  
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },
  
  generateToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  },
  
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  },
  
  calculatePercentage: (count, total) => {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  },
  
  createSuccessResponse: (data) => ({
    success: true,
    data
  }),
  
  createErrorResponse: (code, message, details = null) => ({
    success: false,
    error: { code, message, details }
  })
};

module.exports = helpers;