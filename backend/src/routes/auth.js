const express = require('express');
const authController = require('../controllers/authController.js');
const { validate } = require('../middleware/vaidationMiddlweware.js');
const schemas = require('../utils/validation.js');

const router = express.Router();

router.post('/teacher/login', validate(schemas.teacherLogin), authController.teacherLogin);
router.post('/student/join', validate(schemas.studentJoin), authController.studentJoin);

module.exports = router;