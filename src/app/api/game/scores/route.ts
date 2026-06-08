import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { getCurrentUser } from '@/lib/auth';

export async function GET(r: NextRequest) {
  const user = await getCurrentUser();
  const db = getDb();

  const top5 = db.prepare(`
    SELECT gs.score, gs.created_at, p.name, p.id as person_id
    FROM game_scores gs
    JOIN people p ON gs.person_id = p.id
    ORDER BY gs.score DESC
    LIMIT 5
  `).all() as any[];

  let myRank: any = null;
  if (user) {
    const best = db.prepare('SELECT MAX(score) as best FROM game_scores WHERE person_id=?').get(user.personId) as any;
    if (best?.best) {
      const rank = db.prepare('SELECT COUNT(*) + 1 as rank FROM game_scores WHERE score > ?').get(best.best) as any;
      myRank = { name: user.name, score: best.best, rank: rank?.rank || 1 };
    }
  }

  return NextResponse.json({ top5, myRank });
}

export async function POST(r: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.status !== 'approved') {
    return NextResponse.json({ error: '請登錄後提交分數' }, { status: 401 });
  }
  const { score } = await r.json();
  if (!score || typeof score !== 'number' || score < 0) {
    return NextResponse.json({ error: '無效分數' }, { status: 400 });
  }
  const db = getDb();

  // Check existing best score for this user
  const existing = db.prepare('SELECT id, score FROM game_scores WHERE person_id=?').get(user.personId) as any;

  if (existing) {
    // Only update if new score is higher
    if (score > existing.score) {
      db.prepare('UPDATE game_scores SET score=?, created_at=datetime(\'now\') WHERE id=?').run(score, existing.id);
    }
  } else {
    const id = uuid();
    db.prepare('INSERT INTO game_scores (id, person_id, score) VALUES (?,?,?)').run(id, user.personId, score);
  }

  const best = db.prepare('SELECT MAX(score) as best FROM game_scores WHERE person_id=?').get(user.personId) as any;
  const rank = db.prepare('SELECT COUNT(*) + 1 as rank FROM game_scores WHERE score > ?').get(best.best) as any;

  return NextResponse.json({ best: best.best, rank: rank?.rank || 1, status: 'ok' });
}
