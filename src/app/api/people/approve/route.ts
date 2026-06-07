import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function POST(r: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { id, status } = await r.json();
  if (!id || !['approved', 'rejected'].includes(status))
    return NextResponse.json({ error: '缺少有效参数' }, { status: 400 });
  getDb().prepare('UPDATE people SET status=? WHERE id=?').run(status, id);
  return NextResponse.json({ success: true });
}
