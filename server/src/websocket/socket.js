const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocketServer(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Join a Deal Room project channel
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Deal Room messaging (broadcast to other participants)
    socket.on('project-message', (data) => {
      const msg = {
        ...data,
        senderId: socket.userId,
        sender_id: socket.userId,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      // Broadcast to other users in the project room (sender already has local optimistic copy)
      socket.to(`project:${data.projectId}`).emit('new-message', msg);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`project:${data.projectId}`).emit('user-typing', {
        userId: socket.userId,
        projectId: data.projectId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { initSocketServer, getIO };
