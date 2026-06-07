import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface AdminSessionData { isLoggedIn: boolean; }
export interface UserSessionData { personId: string; name: string; status: string; }

const adminOpts = {
  password: process.env.SESSION_PASSWORD || 'a-very-long-and-secure-password-thirty-two-chars!!',
  cookieName: 'seoul-hwakyoin-admin',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' as const, maxAge: 86400 },
};

const userOpts = {
  password: process.env.SESSION_PASSWORD || 'a-very-long-and-secure-password-thirty-two-chars!!',
  cookieName: 'seoul-hwakyoin-user',
  cookieOptions: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'lax' as const, maxAge: 604800 },
};

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(await cookies(), adminOpts);
}

export async function getUserSession(): Promise<IronSession<UserSessionData>> {
  return getIronSession<UserSessionData>(await cookies(), userOpts);
}

export async function isAdmin(): Promise<boolean> {
  const s = await getAdminSession();
  return s.isLoggedIn === true;
}

export async function isUserLoggedIn(): Promise<boolean> {
  const s = await getUserSession();
  return !!s.personId && s.status === 'approved';
}

export async function getCurrentUser(): Promise<{ personId: string; name: string; status: string } | null> {
  const s = await getUserSession();
  if (!s.personId) return null;
  return { personId: s.personId, name: s.name, status: s.status };
}

// Self-edit JWT tokens (keep existing logic)
export function verifyToken(token: string): { id: string; name: string; exp: number } | null {
  try {
    const p = token.split('.');
    if (p.length !== 3) return null;
    const d = JSON.parse(Buffer.from(p[1], 'base64url').toString());
    if (d.exp && d.exp < Date.now() / 1000) return null;
    return d;
  } catch { return null; }
}

export function createEditToken(id: string, name: string): string {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const pl = Buffer.from(JSON.stringify({ id, name, exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
  return h + '.' + pl + '.self-edit-sig';
}
