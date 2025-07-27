const helpers = require('../utils/helpers');
const schemas = require('../utils/validation');

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Handle chat messages
    socket.on('chat:message', (data) => {
      // Validate message
      const { error } = schemas.chatMessage.validate(data);
      if (error) {
        socket.emit('error', {
          type: 'validation_error',
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
        return;
      }
      
      // Create message object
      const message = {
        messageId: helpers.generateId(),
        message: data.message,
        senderId: data.senderId,
        senderName: data.senderName,
        senderType: data.senderType,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast message to all connected clients
      io.emit('chat:message:broadcast', message);
    });
  });
};