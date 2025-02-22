import { getAccessToken } from '@auth0/nextjs-auth0/edge';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const res = await getAccessToken();
    const { accessToken } = res;

    console.log(accessToken);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    return NextResponse.json({ accessToken });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
