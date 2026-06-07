import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';

function gh(r: NextRequest): string {
  const ip = r.headers.get('x-forwarded-for') || r.headers.get('x-real-ip') || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export async function POST(r: NextRequest) {
  const { person_id, type } = await r.json();
  if (!person_id || !type) return NextResponse.json({ error: '缺少参数' }, { status: 400 });
  if (!['like', 'dislike'].includes(type)) return NextResponse.json({ error: '类型无效' }, { status: 400 });
  const db = getDb();
  const iph = gh(r);
  const ex = db.prepare('SELECT * FROM likes WHERE person_id=? AND ip_hash=?').get(person_id, iph) as any;
  if (ex) {
    if (ex.type === type) db.prepare('DELETE FROM likes WHERE id=?').run(ex.id);
    else db.prepare("UPDATE likes SET type=?,created_at=datetime('now') WHERE id=?").run(type, ex.id);
  } else {
    db.prepare('INSERT INTO likes (id,person_id,type,ip_hash) VALUES (?,?,?,?)').run(uuid(), person_id, type, iph);
  }
  const s = db.prepare("SELECT COALESCE((SELECT COUNT(*) FROM likes WHERE person_id=? AND type='like'),0) as like_count, COALESCE((SELECT COUNT(*) FROM likes WHERE person_id=? AND type='dislike'),0) as dislike_count").get(person_id, person_id) as { like_count: number; dislike_count: number } | undefined;
  const uv = db.prepare('SELECT type FROM likes WHERE person_id=? AND ip_hash=?').get(person_id, iph) as any;
  const counts = s || { like_count: 0, dislike_count: 0 };
  return NextResponse.json({ ...counts, user_vote: uv?.type || null });
}
