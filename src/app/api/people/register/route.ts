import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, type, class_name, photo_url, bio, password, disclaimer_agreed } = body;
  if (!name || !type || !password) return NextResponse.json({ error: '请填写姓名、身份和密码' }, { status: 400 });
  if (name.length < 1 || name.length > 30) return NextResponse.json({ error: '姓名长度应在1-30个字符' }, { status: 400 });
  if (password.length < 4) return NextResponse.json({ error: '密码至少4位' }, { status: 400 });
  if (!disclaimer_agreed) return NextResponse.json({ error: '请同意免责声明' }, { status: 400 });
  if (!['student', 'teacher'].includes(type)) return NextResponse.json({ error: '身份类型无效' }, { status: 400 });
  const db = getDb();
  const ex = db.prepare('SELECT id FROM people WHERE name=? AND type=?').get(name, type);
  if (ex) return NextResponse.json({ error: '已存在同名同身份的人物' }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  const id = uuid();
  db.prepare("INSERT INTO people (id,name,type,class_name,photo_url,bio,password_hash,status) VALUES (?,?,?,?,?,?,?,'pending')").run(id, name, type, class_name || '', photo_url || '', bio || '', hash);
  return NextResponse.json(db.prepare('SELECT * FROM people WHERE id=?').get(id), { status: 201 });
}
