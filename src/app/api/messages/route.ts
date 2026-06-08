import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { getCurrentUser } from '@/lib/auth';
import { getEmitter } from '@/lib/events';

export async function POST(r: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: '請登錄' }, { status: 401 });
  }
  const { receiver_id, content, is_anonymous } = await r.json();
  if (!receiver_id || !content?.trim()) {
    return NextResponse.json({ error: '缺少參數' }, { status: 400 });
  }
  const db = getDb();
  const target = db.prepare('SELECT id FROM people WHERE id=? AND status=\'approved\'').get(receiver_id);
  if (!target) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });

  const id = uuid();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content, is_anonymous, created_at) VALUES (?,?,?,?,?,?)').run(
    id, user.personId, receiver_id, content.trim(), now
  );

  const msg = { id, sender_id: user.personId, sender_name: user.name, receiver_id, content: content.trim(), is_anonymous: is_anonymous ? 1 : 0, read: 0, created_at: now };

  // Notify receiver via SSE
  getEmitter().emit(receiver_id, { type: 'new_message', message: msg });
  // Also notify sender (so their own conversation list updates)
  getEmitter().emit(user.personId, { type: 'new_message', message: msg });

  return NextResponse.json(msg, { status: 201 });
}

export async function GET(r: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: '請登錄' }, { status: 401 });
  }
  const withId = new URL(r.url).searchParams.get('with');
  if (!withId) return NextResponse.json({ error: '缺少with參數' }, { status: 400 });

  const db = getDb();
  const messages = db.prepare(`
    SELECT m.*, CASE WHEN m.is_anonymous = 1 THEN '匿名用戶' ELSE p.name END as sender_name
    FROM messages m
    JOIN people p ON m.sender_id = p.id
    WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all(user.personId, withId, withId, user.personId) as any[];

  return NextResponse.json(messages.reverse());
}
