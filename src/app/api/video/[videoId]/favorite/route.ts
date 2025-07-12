import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { CollectionsService } from '@/lib/collections';

export async function PATCH(req: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split(' ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { favorite } = await req.json();
    if (typeof favorite !== 'boolean') {
      return NextResponse.json({ error: 'favorite flag required' }, { status: 400 });
    }

    await CollectionsService.setVideoFavorite(uid, params.videoId, favorite);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('PATCH /video/:id/favorite error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 