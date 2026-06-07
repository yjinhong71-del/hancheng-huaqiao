import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function POST(r: NextRequest) {
  const { password } = await r.json();
  if (!password || password !== (process.env.ADMIN_PASSWORD || 'admin123'))
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  const s = await getAdminSession();
  s.isLoggedIn = true;
  await s.save();
  return NextResponse.json({ success: true });
}
