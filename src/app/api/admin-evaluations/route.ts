import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function GET(r: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const url = new URL(r.url);
  const pid = url.searchParams.get('personId');
  const search = url.searchParams.get('search');
  const db = getDb();

  let q = `
    SELECT e.*,
      COALESCE(p_eval.name, '早期用戶') as evaluator_name,
      p_target.name as target_name,
      p_target.type as target_type
    FROM evaluations e
    LEFT JOIN people p_eval ON e.evaluator_id = p_eval.id
    LEFT JOIN people p_target ON e.person_id = p_target.id
  `;
  const params: string[] = [];

  if (pid) {
    q += ' WHERE e.person_id = ?';
    params.push(pid);
  }
  if (search) {
    const trimmed = search.trim();
    if (trimmed) {
      q += pid ? ' AND' : ' WHERE';
      q += ' p_eval.name LIKE ?';
      params.push(`%${trimmed}%`);
    }
  }
  q += ' ORDER BY e.created_at DESC';

  const evals = db.prepare(q).all(...params);
  return NextResponse.json(evals);
}
