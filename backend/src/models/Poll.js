const helpers = require('../utils/helpers');
const { POLL_STATUS } = require('../utils/constants');

class Poll {
  constructor() {
    this.polls = new Map();
    this.activePoll = null;
    this.pollHistory = [];
  }
  
  create(question, options, teacherId, timeLimit = 60) {
    if (this.activePoll) {
      return null; // Only one active poll allowed
    }
    
    const poll = {
      pollId: helpers.generateId(),
      question,
      options,
      teacherId,
      createdAt: new Date().toISOString(),
      timeLimit,
      status: POLL_STATUS.ACTIVE,
      answers: new Map(),
      results: {},
      startTime: Date.now()
    };
    
    // Initialize results
    options.forEach(option => {
      poll.results[option] = { count: 0, percentage: 0 };
    });
    
    this.polls.set(poll.pollId, poll);
    this.activePoll = poll.pollId;
    
    // Auto-close poll after time limit
    setTimeout(() => {
      this.closePoll(poll.pollId, 'timeout');
    }, timeLimit * 1000);
    
    return poll;
  }
  
  getActive() {
    if (!this.activePoll) return null;
    return this.polls.get(this.activePoll);
  }
  
  findById(pollId) {
    return this.polls.get(pollId);
  }
  
  submitAnswer(pollId, studentId, answer) {
    const poll = this.polls.get(pollId);
    if (!poll || poll.status !== POLL_STATUS.ACTIVE) {
      return { success: false, error: 'Poll not active' };
    }
    
    if (poll.answers.has(studentId)) {
      return { success: false, error: 'Already answered' };
    }
    
    // Check if time limit exceeded
    const timeElapsed = (Date.now() - poll.startTime) / 1000;
    if (timeElapsed > poll.timeLimit) {
      this.closePoll(pollId, 'timeout');
      return { success: false, error: 'Time limit exceeded' };
    }
    
    poll.answers.set(studentId, answer);
    this.updateResults(pollId);
    
    return { success: true, poll };
  }
  
  updateResults(pollId) {
    const poll = this.polls.get(pollId);
    if (!poll) return;
    
    const totalAnswers = poll.answers.size;
    const answerCounts = {};
    
    // Initialize counts
    poll.options.forEach(option => {
      answerCounts[option] = 0;
    });
    
    // Count answers
    for (const answer of poll.answers.values()) {
      if (answerCounts.hasOwnProperty(answer)) {
        answerCounts[answer]++;
      }
    }
    
    // Update results with percentages
    poll.options.forEach(option => {
      poll.results[option] = {
        count: answerCounts[option],
        percentage: helpers.calculatePercentage(answerCounts[option], totalAnswers)
      };
    });
  }
  
  closePoll(pollId, reason = 'manual') {
    const poll = this.polls.get(pollId);
    if (!poll) return null;
    
    poll.status = reason === 'timeout' ? POLL_STATUS.EXPIRED : POLL_STATUS.CLOSED;
    poll.closedAt = new Date().toISOString();
    poll.closeReason = reason;
    
    if (this.activePoll === pollId) {
      this.activePoll = null;
    }
    
    // Add to history
    this.pollHistory.unshift({
      pollId: poll.pollId,
      question: poll.question,
      options: poll.options,
      totalResponses: poll.answers.size,
      results: { ...poll.results },
      createdAt: poll.createdAt,
      closedAt: poll.closedAt,
      closeReason: reason
    });
    
    return poll;
  }
  
  getHistory(page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      polls: this.pollHistory.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(this.pollHistory.length / limit),
        totalPolls: this.pollHistory.length
      }
    };
  }
  
  getResults(pollId) {
    const poll = this.polls.get(pollId);
    if (!poll) return null;
    
    return {
      pollId: poll.pollId,
      question: poll.question,
      totalResponses: poll.answers.size,
      results: poll.results,
      respondedStudents: Array.from(poll.answers.keys()),
      status: poll.status
    };
  }
}

module.exports = new Poll();