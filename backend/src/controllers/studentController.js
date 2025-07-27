const Student = require('../models/Student.js');
const helpers = require('../utils/helpers.js');
const { ERROR_CODES } = require('../utils/constants.js');

const studentController = {
  kickStudent(req, res) {
    try {
      const { studentId } = req.params;
      
      const student = Student.findById(studentId);
      if (!student) {
        return res.status(404).json(
          helpers.createErrorResponse(ERROR_CODES.STUDENT_NOT_FOUND, 'Student not found')
        );
      }
      
      // Emit kick event to student if they're connected
      const io = req.app.get('io');
      if (student.socketId) {
        io.to(student.socketId).emit('student:kicked', {
          reason: 'kicked_by_teacher',
          message: 'You have been removed from the session'
        });
      }
      
      Student.remove(studentId);
      
      res.json(helpers.createSuccessResponse({
        message: 'Student kicked successfully'
      }));
    } catch (error) {
      console.error('Kick student error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to kick student')
      );
    }
  },
  
  getActiveStudents(req, res) {
    try {
      const students = Student.getActive();
      
      res.json(helpers.createSuccessResponse({
        students: students.map(student => ({
          studentId: student.studentId,
          name: student.name,
          joinedAt: student.joinedAt,
          isActive: student.isActive
        }))
      }));
    } catch (error) {
      console.error('Get active students error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to get active students')
      );
    }
  }
};

module.exports = studentController;