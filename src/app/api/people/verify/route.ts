import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createEditToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { name, password } = await request.json();
  if (!name || !password) return NextResponse.json({ error: '请输入姓名和密码' }, { status: 400 });
  const db = getDb();
  const p = db.prepare('SELECT * FROM people WHERE name=?').get(name) as any;
  if (!p) return NextResponse.json({ error: '姓名或密码错误' }, { status: 401 });
  if (!await bcrypt.compare(password, p.password_hash)) return NextResponse.json({ error: '姓名或密码错误' }, { status: 401 });
  return NextResponse.json({ person: { ...p, password_hash: undefined }, token: createEditToken(p.id, p.name) });
}
