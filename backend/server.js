const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const app = require('./src/app');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io available to the app
app.set('io', io);

// Socket.IO connection handling
require('./src/sockets/pollSocket')(io);
require('./src/sockets/chatSocket')(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});