import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  if (!token) {
    throw new Error('No access token for socket connection');
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinProject(projectId: string) {
  socket?.emit('join-project', projectId);
}

export function leaveProject(projectId: string) {
  socket?.emit('leave-project', projectId);
}

export function sendSocketMessage(projectId: string, body: string) {
  socket?.emit('project-message', { projectId, body });
}

export function emitTyping(projectId: string) {
  socket?.emit('typing', { projectId });
}
