import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(r: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: '請登錄' }, { status: 401 });
  }
  const withId = new URL(r.url).searchParams.get('with');
  if (!withId) return NextResponse.json({ error: '缺少with參數' }, { status: 400 });

  const db = getDb();
  db.prepare('UPDATE messages SET read=1 WHERE sender_id=? AND receiver_id=? AND read=0')
    .run(withId, user.personId);

  return NextResponse.json({ success: true });
}
