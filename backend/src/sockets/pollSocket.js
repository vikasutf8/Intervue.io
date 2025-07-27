const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Poll = require('../models/Poll');
const helpers = require('../utils/helpers');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user identification
    socket.on('identify', (data) => {
      const { userType, userId, token } = data;
      
      if (userType === 'teacher') {
        const decoded = helpers.verifyToken(token);
        if (decoded && decoded.type === 'teacher') {
          Teacher.updateSocketId(decoded.teacherId, socket.id);
          socket.join('teachers');
          socket.userId = decoded.teacherId;
          socket.userType = 'teacher';
          console.log(`Teacher ${decoded.teacherId} connected`);
        }
      } else if (userType === 'student') {
        const decoded = helpers.verifyToken(token);
        if (decoded && decoded.type === 'student') {
          const student = Student.findByName(decoded.name);
          if (student) {
            Student.updateSocketId(student.studentId, socket.id);
            socket.join('students');
            socket.userId = student.studentId;
            socket.userType = 'student';
            
            // Notify teacher about new student
            socket.to('teachers').emit('student:joined', {
              studentId: student.studentId,
              name: student.name,
              joinedAt: student.joinedAt
            });
            
            console.log(`Student ${student.name} connected`);
          }
        }
      }
    });
    
    // Handle poll answer submission via socket
    socket.on('poll:answer', (data) => {
      if (socket.userType !== 'student') return;
      
      const { pollId, answer } = data;
      const student = Student.findById(socket.userId);
      
      if (!student) return;
      
      const result = Poll.submitAnswer(pollId, student.studentId, answer);
      if (result.success) {
        // Broadcast updated results to all clients
        const results = Poll.getResults(pollId);
        io.emit('poll:results:updated', results);
        
        socket.emit('poll:answer:success', { answer });
      } else {
        socket.emit('poll:answer:error', { error: result.error });
      }
    });
    
    // Handle poll timeout warnings
    setInterval(() => {
      const activePoll = Poll.getActive();
      if (activePoll) {
        const timeElapsed = (Date.now() - activePoll.startTime) / 1000;
        const timeRemaining = activePoll.timeLimit - timeElapsed;
        
        if (timeRemaining <= 10 && timeRemaining > 0) {
          io.emit('poll:timeout:warning', {
            pollId: activePoll.pollId,
            timeRemaining: Math.round(timeRemaining)
          });
        }
      }
    }, 1000);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      if (socket.userType === 'teacher' && socket.userId) {
        Teacher.setOffline(socket.userId);
      } else if (socket.userType === 'student' && socket.userId) {
        const student = Student.findById(socket.userId);
        if (student) {
          Student.setInactive(socket.userId);
          socket.to('teachers').emit('student:left', {
            studentId: student.studentId,
            name: student.name,
            leftAt: new Date().toISOString()
          });
        }
      }
    });
  });
};
