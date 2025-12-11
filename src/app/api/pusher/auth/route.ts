import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';

/**
 * API route for Pusher authentication (for private channels if needed)
 * This is optional for public channels but useful for future private channels
 */
export async function POST(request: NextRequest) {
  try {
    const { socket_id, channel_name } = await request.json();

    if (!pusherServer) {
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 });
    }

    // For now, we'll allow all connections since we're using public channels
    // In the future, you can add authentication logic here
    const authResponse = pusherServer.authorizeChannel(socket_id, channel_name);

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 403 });
  }
}