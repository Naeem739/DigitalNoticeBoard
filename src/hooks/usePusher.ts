import { useEffect, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { Channel } from 'pusher-js';

interface UsePusherOptions {
  channelName: string;
  eventName: string;
  onUpdate: (data?: unknown) => void;
  enabled?: boolean;
}

/**
 * Custom hook for managing Pusher real-time updates
 * @param options Configuration for the Pusher connection
 */
export function usePusher({ channelName, eventName, onUpdate, enabled = true }: UsePusherOptions) {
  const channelRef = useRef<Channel | null>(null);
  const pusherRef = useRef(getPusherClient());

  useEffect(() => {
    if (!enabled || !pusherRef.current) return;

    const pusher = pusherRef.current;
    
    // Subscribe to channel
    channelRef.current = pusher.subscribe(channelName);

    // Bind to event
    channelRef.current.bind(eventName, (data: unknown) => {
      console.log(`Pusher event received: ${eventName}`, data);
      onUpdate(data);
    });

    // Handle connection events
    const handleConnect = () => {
      console.log(`Pusher connected for channel: ${channelName}`);
    };

    const handleDisconnect = () => {
      console.log(`Pusher disconnected for channel: ${channelName}`);
    };

    const handleError = (error: unknown) => {
      console.error(`Pusher error for channel ${channelName}:`, error);
    };

    pusher.connection.bind('connected', handleConnect);
    pusher.connection.bind('disconnected', handleDisconnect);
    pusher.connection.bind('error', handleError);

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind(eventName);
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
      
      pusher.connection.unbind('connected', handleConnect);
      pusher.connection.unbind('disconnected', handleDisconnect);
      pusher.connection.unbind('error', handleError);
    };
  }, [channelName, eventName, onUpdate, enabled]);

  return {
    isConnected: pusherRef.current?.connection.state === 'connected',
    channel: channelRef.current,
  };
}

/**
 * Hook specifically for dashboard updates
 * @param onUpdate Callback function when dashboard is updated
 * @param enabled Whether the hook should be active
 */
export function useDashboardUpdates(onUpdate: () => void, enabled = true) {
  return usePusher({
    channelName: 'dashboard-channel',
    eventName: 'dashboard-updated',
    onUpdate,
    enabled,
  });
}

/**
 * Hook specifically for notice updates
 * @param onUpdate Callback function when notice is updated
 * @param enabled Whether the hook should be active
 */
export function useNoticeUpdates(onUpdate: (data?: unknown) => void, enabled = true) {
  return usePusher({
    channelName: 'notices-channel',
    eventName: 'notice-updated',
    onUpdate,
    enabled,
  });
}

/**
 * Hook specifically for public notice settings updates
 * @param onUpdate Callback function when settings are updated
 * @param enabled Whether the hook should be active
 */
export function usePublicNoticeSettingsUpdates(onUpdate: (data?: unknown) => void, enabled = true) {
  return usePusher({
    channelName: 'public-notice-channel',
    eventName: 'settings-updated',
    onUpdate,
    enabled,
  });
}