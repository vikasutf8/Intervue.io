const Poll = require('../models/Poll.js');
const Student = require('../models/Student.js');
const helpers = require('../utils/helpers.js');
const { ERROR_CODES } = require('../utils/constants.js');

const pollController = {
  createPoll(req, res) {
    try {
      const { question, options, timeLimit, teacherId } = req.body;
      
      const poll = Poll.create(question, options, teacherId, timeLimit);
      if (!poll) {
        return res.status(409).json(
          helpers.createErrorResponse(ERROR_CODES.POLL_CREATION_BLOCKED, 'Another poll is already active')
        );
      }
      
      // Broadcast new poll to all connected clients
      const io = req.app.get('io');
      io.emit('poll:created', {
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        timeLimit: poll.timeLimit,
        startTime: poll.startTime
      });
      
      res.json(helpers.createSuccessResponse({
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        timeLimit: poll.timeLimit,
        status: poll.status,
        createdAt: poll.createdAt
      }));
    } catch (error) {
      console.error('Create poll error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to create poll')
      );
    }
  },
  
  getActivePoll(req, res) {
    try {
      const poll = Poll.getActive();
      if (!poll) {
        return res.status(404).json(
          helpers.createErrorResponse(ERROR_CODES.NO_ACTIVE_POLL, 'No active poll found')
        );
      }
      
      const timeElapsed = (Date.now() - poll.startTime) / 1000;
      const timeRemaining = Math.max(0, poll.timeLimit - timeElapsed);
      
      res.json(helpers.createSuccessResponse({
        pollId: poll.pollId,
        question: poll.question,
        options: poll.options,
        timeLimit: poll.timeLimit,
        timeRemaining: Math.round(timeRemaining),
        status: poll.status
      }));
    } catch (error) {
      console.error('Get active poll error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to get active poll')
      );
    }
  },
  
  getPollResults(req, res) {
    try {
      const { pollId } = req.params;
      
      const results = Poll.getResults(pollId);
      if (!results) {
        return res.status(404).json(
          helpers.createErrorResponse(ERROR_CODES.POLL_NOT_FOUND, 'Poll not found')
        );
      }
      
      res.json(helpers.createSuccessResponse(results));
    } catch (error) {
      console.error('Get poll results error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to get poll results')
      );
    }
  },
  
  submitAnswer(req, res) {
    try {
      const { pollId } = req.params;
      const { answer, studentId } = req.body;
      
      const result = Poll.submitAnswer(pollId, studentId, answer);
      if (!result.success) {
        const errorCode = result.error === 'Already answered' ? ERROR_CODES.POLL_ALREADY_ANSWERED :
                         result.error === 'Time limit exceeded' ? ERROR_CODES.POLL_EXPIRED :
                         ERROR_CODES.POLL_NOT_FOUND;
        
        return res.status(400).json(
          helpers.createErrorResponse(errorCode, result.error)
        );
      }
      
      // Broadcast updated results to all clients
      const io = req.app.get('io');
      const results = Poll.getResults(pollId);
      io.emit('poll:results:updated', results);
      
      res.json(helpers.createSuccessResponse({
        answered: true,
        answer
      }));
    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to submit answer')
      );
    }
  },
  
  getPollHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const history = Poll.getHistory(page, limit);
      
      res.json(helpers.createSuccessResponse(history));
    } catch (error) {
      console.error('Get poll history error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to get poll history')
      );
    }
  },
  
  closePoll(req, res) {
    try {
      const { pollId } = req.params;
      
      const poll = Poll.closePoll(pollId, 'teacher_closed');
      if (!poll) {
        return res.status(404).json(
          helpers.createErrorResponse(ERROR_CODES.POLL_NOT_FOUND, 'Poll not found')
        );
      }
      
      // Broadcast poll closed event
      const io = req.app.get('io');
      const finalResults = Poll.getResults(pollId);
      io.emit('poll:closed', {
        pollId,
        finalResults,
        reason: 'teacher_closed'
      });
      
      res.json(helpers.createSuccessResponse({
        pollId,
        status: poll.status
      }));
    } catch (error) {
      console.error('Close poll error:', error);
      res.status(500).json(
        helpers.createErrorResponse('SERVER_ERROR', 'Failed to close poll')
      );
    }
  }
};

module.exports = pollController;