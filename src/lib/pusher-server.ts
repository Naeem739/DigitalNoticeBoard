import Pusher from 'pusher';

// Check if Pusher credentials are available
const isPusherConfigured = 
  process.env.PUSHER_APP_ID && 
  process.env.PUSHER_KEY && 
  process.env.PUSHER_SECRET;

// Initialize Pusher server instance only if credentials are available
export const pusherServer = isPusherConfigured ? new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'ap2',
  useTLS: true,
}) : null;

/**
 * Emit dashboard update event to all subscribed clients
 * @param dashboardData - Optional data to send with the update
 */
export async function emitDashboardUpdate(dashboardData?: unknown) {
  if (!pusherServer) {
    console.warn('Pusher not configured - dashboard update not sent');
    return;
  }
  
  try {
    await pusherServer.trigger('dashboard-channel', 'dashboard-updated', {
      timestamp: new Date().toISOString(),
      data: dashboardData,
    });
    console.log('Dashboard update emitted to Pusher channel');
  } catch (error) {
    console.error('Failed to emit dashboard update via Pusher:', error);
  }
}

/**
 * Emit notice update event to all subscribed clients
 * @param noticeData - Optional notice data to send with the update
 */
export async function emitNoticeUpdate(noticeData?: unknown) {
  if (!pusherServer) {
    console.warn('Pusher not configured - notice update not sent');
    return;
  }
  
  try {
    await pusherServer.trigger('notices-channel', 'notice-updated', {
      timestamp: new Date().toISOString(),
      data: noticeData,
    });
    console.log('Notice update emitted to Pusher channel');
  } catch (error) {
    console.error('Failed to emit notice update via Pusher:', error);
  }
}

/**
 * Emit public notice settings update event
 * @param settingsData - Optional settings data to send with the update
 */
export async function emitPublicNoticeSettingsUpdate(settingsData?: unknown) {
  if (!pusherServer) {
    console.warn('Pusher not configured - public notice settings update not sent');
    return;
  }
  
  try {
    await pusherServer.trigger('public-notice-channel', 'settings-updated', {
      timestamp: new Date().toISOString(),
      data: settingsData,
    });
    console.log('Public notice settings update emitted to Pusher channel');
  } catch (error) {
    console.error('Failed to emit public notice settings update via Pusher:', error);
  }
}