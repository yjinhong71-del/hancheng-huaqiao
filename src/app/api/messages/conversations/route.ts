import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: '請登錄' }, { status: 401 });
  }
  const db = getDb();

  // Normal conversations (non-anonymous)
  const conversations = db.prepare(`
    SELECT 
      p.id as partner_id,
      p.name as partner_name,
      p.photo_url as partner_photo,
      last_msg.content as last_message,
      last_msg.created_at as last_time,
      last_msg.sender_id as last_sender_id,
      (SELECT COUNT(*) FROM messages WHERE sender_id=p.id AND receiver_id=? AND read=0 AND is_anonymous=0) as unread
    FROM people p
    JOIN (
      SELECT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id,
        content, created_at, sender_id,
        ROW_NUMBER() OVER (PARTITION BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END ORDER BY created_at DESC) as rn
      FROM messages
      WHERE (sender_id = ? OR receiver_id = ?) AND is_anonymous = 0
    ) last_msg ON p.id = last_msg.partner_id AND last_msg.rn = 1
    ORDER BY last_msg.created_at DESC
  `).all(user.personId, user.personId, user.personId, user.personId, user.personId) as any[];

  // Check for anonymous messages
  const anonCount = db.prepare(
    'SELECT COUNT(*) as cnt FROM messages WHERE receiver_id=? AND is_anonymous=1'
  ).get(user.personId) as any;

  if (anonCount?.cnt > 0) {
    const lastAnon = db.prepare(
      'SELECT content, created_at FROM messages WHERE receiver_id=? AND is_anonymous=1 ORDER BY created_at DESC LIMIT 1'
    ).get(user.personId) as any;

    const unreadAnon = db.prepare(
      'SELECT COUNT(*) as cnt FROM messages WHERE receiver_id=? AND is_anonymous=1 AND read=0'
    ).get(user.personId) as any;

    conversations.unshift({
      partner_id: '__anonymous__',
      partner_name: '匿名',
      partner_photo: '',
      last_message: lastAnon?.content || '',
      last_time: lastAnon?.created_at || '',
      last_sender_id: '__anonymous__',
      unread: unreadAnon?.cnt || 0,
    });
  }

  return NextResponse.json(conversations);
}
