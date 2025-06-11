import { BskyAgent } from '@atproto/api';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { handle, password } = await request.json();

    if (!handle || !password) {
      return NextResponse.json(
        { error: 'Handle and password are required' },
        { status: 400 }
      );
    }

    const agent = new BskyAgent({
      service: 'https://bsky.social'
    });

    // Attempt to login
    const response = await agent.login({
      identifier: handle,
      password: password,
    });

    if (!response.success) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Store session data in cookies
    const cookieStore = await cookies();
    cookieStore.set('bsky-session', JSON.stringify({
      accessJwt: response.data.accessJwt,
      refreshJwt: response.data.refreshJwt,
      handle: response.data.handle,
      did: response.data.did,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ 
      success: true,
      handle: response.data.handle 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}