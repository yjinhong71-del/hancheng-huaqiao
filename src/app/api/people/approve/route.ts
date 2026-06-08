import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function POST(r: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { id, status, reason } = await r.json();
  if (!id || !['approved', 'rejected'].includes(status))
    return NextResponse.json({ error: '缺少有效参数' }, { status: 400 });
  const db = getDb();
  if (status === 'rejected' && reason) {
    db.prepare('UPDATE people SET status=?, rejection_reason=? WHERE id=?').run(status, reason, id);
  } else {
    db.prepare('UPDATE people SET status=? WHERE id=?').run(status, id);
  }
  return NextResponse.json({ success: true });
}
