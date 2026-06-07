import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  const s = await getAdminSession();
  return NextResponse.json({ isLoggedIn: s.isLoggedIn === true });
}
