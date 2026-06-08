import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: '請登錄' }, { status: 401 });
  }
  const db = getDb();

  // Get all distinct conversation partners with last message and unread count
  const conversations = db.prepare(`
    SELECT 
      p.id as partner_id,
      p.name as partner_name,
      p.photo_url as partner_photo,
      last_msg.content as last_message,
      last_msg.created_at as last_time,
      last_msg.sender_id as last_sender_id,
      (SELECT COUNT(*) FROM messages WHERE sender_id=p.id AND receiver_id=? AND read=0) as unread
    FROM people p
    JOIN (
      SELECT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id,
        content, created_at, sender_id,
        ROW_NUMBER() OVER (PARTITION BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END ORDER BY created_at DESC) as rn
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    ) last_msg ON p.id = last_msg.partner_id AND last_msg.rn = 1
    ORDER BY last_msg.created_at DESC
  `).all(user.personId, user.personId, user.personId, user.personId, user.personId) as any[];

  return NextResponse.json(conversations);
}
