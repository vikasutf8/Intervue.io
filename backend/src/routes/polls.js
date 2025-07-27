const express = require('express');
const pollController = require('../controllers/pollController.js');
const { authenticateTeacher, authenticateStudent } = require('../middleware/authMiddleware.js');
const { validate } = require('../middleware/vaidationMiddlweware.js');
const schemas = require('../utils/validation.js');

const router = express.Router();

router.post('/', authenticateTeacher, validate(schemas.createPoll), pollController.createPoll);
router.get('/active', pollController.getActivePoll);
router.get('/history', authenticateTeacher, pollController.getPollHistory);
router.get('/:pollId/results', pollController.getPollResults);
router.post('/:pollId/answer', authenticateStudent, validate(schemas.submitAnswer), pollController.submitAnswer);
router.put('/:pollId/close', authenticateTeacher, pollController.closePoll);

module.exports = router;