import { Server as SocketIOServer } from 'socket.io';

declare global {
  const io: SocketIOServer | undefined;
}

export {};


