const express = require('express');
const pollController = require('../controllers/pollController');
const { authenticateTeacher, authenticateStudent } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const schemas = require('../utils/validation');

const router = express.Router();

router.post('/', authenticateTeacher, validate(schemas.createPoll), pollController.createPoll);
router.get('/active', pollController.getActivePoll);
router.get('/history', authenticateTeacher, pollController.getPollHistory);
router.get('/:pollId/results', pollController.getPollResults);
router.post('/:pollId/answer', authenticateStudent, validate(schemas.submitAnswer), pollController.submitAnswer);
router.put('/:pollId/close', authenticateTeacher, pollController.closePoll);

module.exports = router;