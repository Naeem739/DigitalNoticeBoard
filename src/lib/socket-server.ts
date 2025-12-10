import { Server as SocketIOServer } from 'socket.io';

// Get Socket.IO instance from global (set by server.js)
export function getSocketIO(): SocketIOServer | null {
  if (typeof global !== 'undefined' && (global as any).io) {
    return (global as any).io as SocketIOServer;
  }
  return null;
}

export function emitDashboardUpdate(dashboardData?: any) {
  const io = getSocketIO();
  if (io) {
    io.to('dashboard-updates').emit('dashboard-updated', {
      timestamp: new Date().toISOString(),
      data: dashboardData,
    });
    console.log('Dashboard update emitted to all clients');
  } else {
    console.warn('Socket.IO server not initialized, cannot emit dashboard update');
  }
}

