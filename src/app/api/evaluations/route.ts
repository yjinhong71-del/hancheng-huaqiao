import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { isAdmin, getCurrentUser } from '@/lib/auth';

export async function GET(r: NextRequest) {
  const pid = new URL(r.url).searchParams.get('personId');
  if (!pid) return NextResponse.json({ error: '缺少personId' }, { status: 400 });
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: '请登录后查看评价' }, { status: 401 });
  }
  const db = getDb();
  const evals = db.prepare(`
    SELECT e.*, 
      CASE WHEN e.is_anonymous = 1 THEN '匿名用戶' ELSE COALESCE(p.name, '早期用戶') END as evaluator_name
    FROM evaluations e
    LEFT JOIN people p ON e.evaluator_id = p.id
    WHERE e.person_id = ? AND e.approved = 1
    ORDER BY e.created_at DESC
  `).all(pid);
  return NextResponse.json(evals);
}

export async function POST(r: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') return NextResponse.json({ error: '请登录后评价' }, { status: 401 });
  const { person_id, appearance, personality, grades, talent, popularity, comment, is_anonymous } = await r.json();
  if (!person_id) return NextResponse.json({ error: '缺少人物ID' }, { status: 400 });
  const db = getDb();
  const target = db.prepare('SELECT id, status FROM people WHERE id=?').get(person_id) as any;
  if (!target) return NextResponse.json({ error: '人物不存在' }, { status: 404 });
  if (target.status !== 'approved') return NextResponse.json({ error: '该人物尚未通过审核' }, { status: 400 });
  const id = uuid();
  db.prepare('INSERT INTO evaluations (id, person_id, evaluator_id, appearance, personality, grades, talent, popularity, comment, approved, is_anonymous) VALUES (?,?,?,?,?,?,?,?,?,1,?)').run(
    id, person_id, user.personId, appearance || 0, personality || 0, grades || 0, talent || 0, popularity || 0, comment || '', is_anonymous ? 1 : 0
  );
  const result = db.prepare(`
    SELECT e.*, COALESCE(p.name, '早期用戶') as evaluator_name
    FROM evaluations e
    LEFT JOIN people p ON e.evaluator_id = p.id
    WHERE e.id = ?
  `).get(id);
  return NextResponse.json(result, { status: 201 });
}

export async function PUT(r: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { id, approved } = await r.json();
  if (!id) return NextResponse.json({ error: '缺少评价ID' }, { status: 400 });
  getDb().prepare('UPDATE evaluations SET approved=? WHERE id=?').run(approved ? 1 : 0, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(r: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const id = new URL(r.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少评价ID' }, { status: 400 });
  getDb().prepare('DELETE FROM evaluations WHERE id=?').run(id);
  return NextResponse.json({ success: true });
}
