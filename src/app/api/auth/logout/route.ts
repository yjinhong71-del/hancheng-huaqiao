import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';

export async function POST() {
  const s = await getAdminSession();
  s.destroy();
  return NextResponse.json({ success: true });
}
