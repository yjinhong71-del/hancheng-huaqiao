import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getUserSession } from '@/lib/auth';

export async function POST(r: NextRequest) {
  const { name, password } = await r.json();
  if (!name || !password) return NextResponse.json({ error: '请输入姓名和密码' }, { status: 400 });
  const db = getDb();
  const p = db.prepare('SELECT * FROM people WHERE name=?').get(name) as any;
  if (!p) return NextResponse.json({ error: '姓名或密码错误' }, { status: 401 });
  if (!await bcrypt.compare(password, p.password_hash))
    return NextResponse.json({ error: '姓名或密码错误' }, { status: 401 });
  const s = await getUserSession();
  s.personId = p.id;
  s.name = p.name;
  s.status = p.status;
  await s.save();
  const resp: any = { personId: p.id, name: p.name, status: p.status };
  if (p.status === 'rejected') {
    resp.rejection_reason = p.rejection_reason || '';
  }
  return NextResponse.json(resp);
}
