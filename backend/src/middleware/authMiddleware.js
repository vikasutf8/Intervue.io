const helpers = require('../utils/helpers.js');
const { ERROR_CODES } = require('../utils/constants.js');
const Student = require('../models/Student.js');

const authenticateTeacher = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json(
      helpers.createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'No token provided')
    );
  }
  
  const decoded = helpers.verifyToken(token);
  if (!decoded || decoded.type !== 'teacher') {
    return res.status(401).json(
      helpers.createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Invalid teacher token')
    );
  }
  
  req.teacher = decoded;
  next();
};

const authenticateStudent = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json(
      helpers.createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'No token provided')
    );
  }
  
  const decoded = helpers.verifyToken(token);
  if (!decoded || decoded.type !== 'student') {
    return res.status(401).json(
      helpers.createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Invalid student token')
    );
  }
  
  // Verify student exists
  const student = Student.findByName(decoded.name);
  if (!student) {
    return res.status(401).json(
      helpers.createErrorResponse(ERROR_CODES.STUDENT_NOT_FOUND, 'Student not found')
    );
  }
  
  req.student = student;
  next();
};

module.exports = {
  authenticateTeacher,
  authenticateStudent
};