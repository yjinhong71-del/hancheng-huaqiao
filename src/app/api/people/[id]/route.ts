import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { isAdmin, getCurrentUser } from '@/lib/auth';

export async function GET(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const user = await getCurrentUser();
  const isLoggedIn = !!(user && user.status === 'approved');

  const p = db.prepare(`SELECT p.*, COALESCE(ROUND(AVG(e.appearance),1),0) as avg_appearance, COALESCE(ROUND(AVG(e.personality),1),0) as avg_personality, COALESCE(ROUND(AVG(e.grades),1),0) as avg_grades, COALESCE(ROUND(AVG(e.talent),1),0) as avg_talent, COALESCE(ROUND(AVG(e.popularity),1),0) as avg_popularity, COALESCE(ROUND((AVG(e.appearance)+AVG(e.personality)+AVG(e.grades)+AVG(e.talent)+AVG(e.popularity))/5.0,1),0) as overall_avg, COALESCE((SELECT COUNT(*) FROM likes WHERE person_id=p.id AND type='like'),0) as like_count, COALESCE((SELECT COUNT(*) FROM likes WHERE person_id=p.id AND type='dislike'),0) as dislike_count, COALESCE((SELECT COUNT(*) FROM evaluations WHERE person_id=p.id),0) as evaluation_count FROM people p LEFT JOIN evaluations e ON e.person_id=p.id WHERE p.id=? GROUP BY p.id`).get(id);

  if (!p) return NextResponse.json({ error: '人物不存在' }, { status: 404 });
  if (!isLoggedIn) {
    return NextResponse.json({
      ...p, avg_appearance: 0, avg_personality: 0, avg_grades: 0, avg_talent: 0, avg_popularity: 0, overall_avg: 0
    });
  }
  return NextResponse.json(p);
}

export async function PUT(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { id } = await params;
  const { name, type, class_name, photo_url, bio, password } = await r.json();
  const db = getDb();
  if (!db.prepare('SELECT id FROM people WHERE id=?').get(id)) return NextResponse.json({ error: '人物不存在' }, { status: 404 });
  const ups = ["updated_at=datetime('now')"];
  const vals: (string | null)[] = [];
  if (name !== undefined) { ups.push('name=?'); vals.push(name); }
  if (type !== undefined) { ups.push('type=?'); vals.push(type); }
  if (class_name !== undefined) { ups.push('class_name=?'); vals.push(class_name); }
  if (photo_url !== undefined) { ups.push('photo_url=?'); vals.push(photo_url); }
  if (bio !== undefined) { ups.push('bio=?'); vals.push(bio); }
  if (password) { vals.push(await bcrypt.hash(password, 10)); ups.push('password_hash=?'); }
  vals.push(id);
  db.prepare(`UPDATE people SET ${ups.join(',')} WHERE id=?`).run(...vals);
  return NextResponse.json(db.prepare('SELECT * FROM people WHERE id=?').get(id));
}

export async function DELETE(r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { id } = await params;
  getDb().prepare('DELETE FROM people WHERE id=?').run(id);
  return NextResponse.json({ success: true });
}
