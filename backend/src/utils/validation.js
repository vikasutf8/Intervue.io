const Joi = require('joi');

const schemas = {
  teacherLogin: Joi.object({
    teacherId: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(6)
  }),
  
  studentJoin: Joi.object({
    name: Joi.string().required().min(2).max(50),
    sessionId: Joi.string().optional()
  }),
  
  createPoll: Joi.object({
    question: Joi.string().required().min(5).max(500),
    options: Joi.array().items(Joi.string().min(1).max(200)).min(2).max(6).required(),
    timeLimit: Joi.number().integer().min(10).max(300).default(60),
    teacherId: Joi.string().required()
  }),
  
  submitAnswer: Joi.object({
    answer: Joi.string().required(),
    studentId: Joi.string().required()
  }),
  
  chatMessage: Joi.object({
    message: Joi.string().required().min(1).max(1000),
    senderId: Joi.string().required(),
    senderName: Joi.string().required(),
    senderType: Joi.string().valid('teacher', 'student').required()
  })
};

module.exports = schemas;
