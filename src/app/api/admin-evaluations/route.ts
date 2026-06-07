import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function GET(r: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const pid = new URL(r.url).searchParams.get('personId');
  const db = getDb();
  if (pid) {
    const evals = db.prepare(`
      SELECT e.*, COALESCE(p.name, '早期用户') as evaluator_name
      FROM evaluations e
      LEFT JOIN people p ON e.evaluator_id = p.id
      WHERE e.person_id = ?
      ORDER BY e.created_at DESC
    `).all(pid);
    return NextResponse.json(evals);
  }
  return NextResponse.json(db.prepare('SELECT e.*, COALESCE(p.name, \'早期用户\') as evaluator_name FROM evaluations e LEFT JOIN people p ON e.evaluator_id=p.id ORDER BY e.created_at DESC').all());
}
