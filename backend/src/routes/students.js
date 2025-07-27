const express = require('express');
const studentController = require('../controllers/studentController.js');
const { authenticateTeacher } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.delete('/:studentId/kick', authenticateTeacher, studentController.kickStudent);
router.get('/active', authenticateTeacher, studentController.getActiveStudents);

module.exports = router;