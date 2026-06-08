import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';
import { isAdmin, getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const className = searchParams.get('class');
  const statusFilter = searchParams.get('status');
  const isAdminReq = await isAdmin();
  const user = await getCurrentUser();
  const isLoggedIn = !!(user && user.status === 'approved');

  let q = `SELECT p.*, COALESCE(ROUND(AVG(e.appearance),1),0) as avg_appearance, COALESCE(ROUND(AVG(e.personality),1),0) as avg_personality, COALESCE(ROUND(AVG(e.grades),1),0) as avg_grades, COALESCE(ROUND(AVG(e.talent),1),0) as avg_talent, COALESCE(ROUND(AVG(e.popularity),1),0) as avg_popularity, COALESCE(ROUND((AVG(e.appearance)+AVG(e.personality)+AVG(e.grades)+AVG(e.talent)+AVG(e.popularity))/5.0,1),0) as overall_avg, COALESCE((SELECT COUNT(*) FROM likes WHERE person_id=p.id AND type='like'),0) as like_count, COALESCE((SELECT COUNT(*) FROM likes WHERE person_id=p.id AND type='dislike'),0) as dislike_count, COALESCE((SELECT COUNT(*) FROM evaluations WHERE person_id=p.id),0) as evaluation_count FROM people p LEFT JOIN evaluations e ON e.person_id=p.id`;
  const c: string[] = [];
  const p: Record<string, string> = {};

  if (type === 'student' || type === 'teacher') { c.push('p.type=@type'); p['type'] = type; }
  if (className) { c.push('p.class_name=@class'); p['class'] = className; }

  if (isAdminReq && statusFilter) {
    c.push('p.status=@status'); p['status'] = statusFilter;
  } else if (!isAdminReq) {
    c.push("p.status='approved'");
  }

  if (c.length) q += ' WHERE ' + c.join(' AND ');
  q += ' GROUP BY p.id ORDER BY p.class_name, p.name';

  const people = db.prepare(q).all(p) as any[];
  if (!isLoggedIn && !isAdminReq) {
    return NextResponse.json(people.map((p: any) => ({
      ...p, avg_appearance: 0, avg_personality: 0, avg_grades: 0, avg_talent: 0, avg_popularity: 0, overall_avg: 0,
      like_count: 0, dislike_count: 0, evaluation_count: 0
    })));
  }
  return NextResponse.json(people);
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { name, type, class_name, photo_url, bio, password } = await request.json();
  if (!name || !type || !password) return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  const db = getDb();
  const hash = await bcrypt.hash(password, 10);
  const id = uuid();
  db.prepare('INSERT INTO people(id,name,type,class_name,photo_url,bio,password_hash,status) VALUES(?,?,?,?,?,?,?,\'approved\')').run(id, name, type, class_name || '', photo_url || '', bio || '', hash);
  return NextResponse.json(db.prepare('SELECT * FROM people WHERE id=?').get(id), { status: 201 });
}
