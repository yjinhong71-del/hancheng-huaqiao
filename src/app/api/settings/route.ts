import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function GET(r: NextRequest) {
  const key = new URL(r.url).searchParams.get('key');
  if (!key) return NextResponse.json({ error: '缺少key' }, { status: 400 });
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key=?').get(key) as any;
  return NextResponse.json({ key, value: row?.value || '' });
}

export async function PUT(r: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: '未授权' }, { status: 401 });
  const { key, value } = await r.json();
  if (!key) return NextResponse.json({ error: '缺少key' }, { status: 400 });
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value || '');
  return NextResponse.json({ key, value: value || '' });
}
