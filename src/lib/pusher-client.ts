import PusherJS from 'pusher-js';

let pusherClient: PusherJS | null = null;

/**
 * Get or create Pusher client instance
 * @returns Pusher client instance or null if on server or not configured
 */
export function getPusherClient(): PusherJS | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check if Pusher is configured
  if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
    console.warn('Pusher client not configured - NEXT_PUBLIC_PUSHER_KEY missing');
    return null;
  }

  if (!pusherClient) {
    try {
      pusherClient = new PusherJS(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
      });

      // Log connection events for debugging
      pusherClient.connection.bind('connected', () => {
        console.log('Pusher connected');
      });

      pusherClient.connection.bind('disconnected', () => {
        console.log('Pusher disconnected');
      });

      pusherClient.connection.bind('error', (error: unknown) => {
        console.error('Pusher connection error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize Pusher client:', error);
      return null;
    }
  }

  return pusherClient;
}

/**
 * Disconnect Pusher client
 */
export function disconnectPusher() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}