const Teacher = require('../models/Teacher.js');
const Student = require('../models/Student.js');
const helpers = require('../utils/helpers.js');
const { ERROR_CODES } = require('../utils/constants.js');

const authController = {
  async teacherLogin(req, res) {
    try {
      const { teacherId, password } = req.body;
    
      
      const teacher = await Teacher.findByCredentials(teacherId, password);
      if (!teacher) {
        return res.status(401).json(
          helpers.createErrorResponse(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid credentials')
        );
      }
      
      const token = helpers.generateToken({ teacherId, type: 'teacher' });
      
      res.json(helpers.createSuccessResponse({
        teacherId,
        token
      }));
    } catch (error) {
      console.error('Teacher login error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Login failed')
      );
    }
  },
  
  studentJoin(req, res) {
    try {
      const { name, sessionId } = req.body;
      
      const student = Student.create(name);
      if (!student) {
        return res.status(409).json(
          helpers.createErrorResponse(ERROR_CODES.DUPLICATE_NAME, 'Name already taken')
        );
      }
      
      res.json(helpers.createSuccessResponse({
        studentId: student.studentId,
        name: student.name,
        sessionToken: student.sessionToken
      }));
    } catch (error) {
      console.error('Student join error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Join failed')
      );
    }
  }
};

module.exports = authController;