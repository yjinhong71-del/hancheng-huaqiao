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
  const db = getDb(); try { db.exec("ALTER TABLE messages ADD COLUMN is_anonymous INTEGER DEFAULT 0"); } catch {};

  let actualReceiverId = receiver_id;
  if (receiver_id === '__anonymous__') {
    const lastAnon = db.prepare('SELECT sender_id FROM messages WHERE receiver_id=? AND is_anonymous=1 ORDER BY created_at DESC LIMIT 1').get(user.personId) as any;
    if (!lastAnon) return NextResponse.json({ error: '無法回覆匿名訊息' }, { status: 400 });
    actualReceiverId = lastAnon.sender_id;
  } else {
    const target = db.prepare("SELECT id FROM people WHERE id=? AND status='approved'").get(actualReceiverId);
    if (!target) return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
  }

  const id = uuid();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content, is_anonymous, created_at) VALUES (?,?,?,?,?,?)').run(
    id, user.personId, actualReceiverId, content.trim(), is_anonymous ? 1 : 0, now
  );

  const msg = { id, sender_id: user.personId, sender_name: user.name, receiver_id: actualReceiverId, content: content.trim(), is_anonymous: is_anonymous ? 1 : 0, read: 0, created_at: now };

  getEmitter().emit(actualReceiverId, { type: 'new_message', message: msg });
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

  const db = getDb(); try { db.exec("ALTER TABLE messages ADD COLUMN is_anonymous INTEGER DEFAULT 0"); } catch {};

  if (withId === '__anonymous__') {
    const msgs = db.prepare("SELECT m.*, '匿名' as sender_name FROM messages m WHERE m.receiver_id=? AND m.is_anonymous=1 UNION ALL SELECT m.*, p.name as sender_name FROM messages m JOIN people p ON m.sender_id=p.id WHERE m.sender_id=? AND m.receiver_id IN (SELECT sender_id FROM messages WHERE receiver_id=? AND is_anonymous=1) ORDER BY created_at DESC LIMIT 100").all(user.personId, user.personId, user.personId) as any[];
    return NextResponse.json(msgs.reverse());
  }

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
