'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trophy, Send, Lock } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';

type Grid = number[][];
type LeaderboardEntry = { name: string; score: number; person_id: string; created_at: string };
type MyRank = { name: string; score: number; rank: number } | null;

const SIZE = 4;
const TILE_COLORS: Record<number, string> = {
  0: 'bg-black/[0.03]',
  2: 'bg-amber-50 text-amber-800',
  4: 'bg-amber-100 text-amber-800',
  8: 'bg-orange-100 text-orange-800',
  16: 'bg-orange-200 text-orange-900',
  32: 'bg-red-200 text-red-900',
  64: 'bg-red-300 text-red-950',
  128: 'bg-yellow-200 text-yellow-900',
  256: 'bg-yellow-300 text-yellow-950',
  512: 'bg-green-200 text-green-900',
  1024: 'bg-green-300 text-green-950',
  2048: 'bg-blue-200 text-blue-900',
  4096: 'bg-blue-300 text-blue-950',
  8192: 'bg-purple-200 text-purple-900',
};

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function cloneGrid(g: Grid): Grid {
  return g.map(r => [...r]);
}

function getEmpty(g: Grid): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (g[r][c] === 0) cells.push([r, c]);
  return cells;
}

function addRandomTile(g: Grid): Grid {
  const empty = getEmpty(g);
  if (empty.length === 0) return g;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  g[r][c] = Math.random() < 0.9 ? 2 : 4;
  return g;
}

function initGrid(): Grid {
  let g = emptyGrid();
  g = addRandomTile(g);
  g = addRandomTile(g);
  return g;
}

function slideRow(row: number[]): { row: number[]; merged: number } {
  let filtered = row.filter(v => v !== 0);
  let merged = 0;
  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i] === filtered[i + 1]) {
      filtered[i] *= 2;
      merged += filtered[i];
      filtered.splice(i + 1, 1);
    }
  }
  while (filtered.length < SIZE) filtered.push(0);
  return { row: filtered, merged };
}

function moveGrid(g: Grid, dir: 'up' | 'down' | 'left' | 'right'): { grid: Grid; merged: number } {
  let ng = cloneGrid(g);
  let totalMerged = 0;

  for (let i = 0; i < SIZE; i++) {
    let row: number[] = [];
    for (let j = 0; j < SIZE; j++) {
      if (dir === 'left') row.push(ng[i][j]);
      else if (dir === 'right') row.push(ng[i][SIZE - 1 - j]);
      else if (dir === 'up') row.push(ng[j][i]);
      else if (dir === 'down') row.push(ng[SIZE - 1 - j][i]);
    }
    const result = slideRow(row);
    totalMerged += result.merged;
    if (dir === 'left') ng[i] = result.row;
    else if (dir === 'right') ng[i] = result.row.reverse();
    else if (dir === 'up') for (let j = 0; j < SIZE; j++) ng[j][i] = result.row[j];
    else if (dir === 'down') for (let j = 0; j < SIZE; j++) ng[SIZE - 1 - j][i] = result.row[j];
  }
  return { grid: ng, merged: totalMerged };
}

function canMove(g: Grid): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === 0) return true;
      if (c < SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
      if (r < SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
    }
  return false;
}

export default function GamePage() {
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank>(null);
  const [user, setUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const scoreRef = useRef(0);

  const fetchScores = useCallback(async () => {
    const r = await fetch('/api/game/scores');
    if (r.ok) {
      const d = await r.json();
      setLeaderboard(d.top5 || []);
      setMyRank(d.myRank);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    const r = await fetch('/api/auth/user-session');
    if (r.ok) setUser(await r.json());
  }, []);

  useEffect(() => { fetchUser(); fetchScores(); }, [fetchUser, fetchScores]);

  const move = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;
    const prev = cloneGrid(grid);
    const result = moveGrid(prev, dir);
    const same = prev.every((r, ri) => r.every((v, ci) => v === result.grid[ri][ci]));
    if (same) return;
    const newScore = scoreRef.current + result.merged;
    scoreRef.current = newScore;
    let ng = addRandomTile(result.grid);
    const stillCanMove = canMove(ng);
    const reached2048 = ng.some(r => r.some(v => v >= 2048));
    setGrid(ng);
    setScore(newScore);
    if (!stillCanMove) {
      setTimeout(() => setGameOver(true), 200);
      if (reached2048) setWon(true);
    }
  }, [grid, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  };

  const restart = () => {
    setGrid(initGrid());
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    setWon(false);
    setSubmitted(false);
  };

  const submitScore = async () => {
    if (!user?.loggedIn || submitted) return;
    setSubmitting(true);
    const r = await fetch('/api/game/scores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: scoreRef.current })
    });
    if (r.ok) { setSubmitted(true); fetchScores(); }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <AnimatedSection>
        <h1 className="text-2xl font-bold text-black mb-8 tracking-tight">2048 校園排行榜</h1>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={0.1}>
          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-neutral-500 font-medium">分數</div>
                <div className="text-2xl font-bold text-black">{score}</div>
              </div>
              <button onClick={restart} className="p-3 text-neutral-500 hover:text-black hover:bg-black/[0.04] rounded-full transition-colors" title="重新開始">
                <RotateCcw size={20} />
              </button>
            </div>

            <div className="bg-black/[0.03] rounded-2xl p-2 sm:p-3 select-none"
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {grid.map((row, ri) =>
                  row.map((val, ci) => (
                    <motion.div key={`${ri}-${ci}`} layout
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className={`aspect-square rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold ${TILE_COLORS[val] || 'bg-black text-white'}`}>
                      {val > 0 && (val > 1000 ? `${(val / 1000).toFixed(0)}K` : val)}
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            <AnimatePresence>
              {gameOver && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-center">
                  <p className="text-sm font-semibold text-red-600 mb-3">
                    {won ? '🎉 你達到了 2048！' : '遊戲結束'}
                  </p>
                  {user?.loggedIn ? (
                    submitted ? (
                      <p className="text-xs text-green-600 font-medium">分數已提交 ✓</p>
                    ) : (
                      <button onClick={submitScore} disabled={submitting}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-full hover:bg-neutral-800 disabled:opacity-40 transition-colors duration-200 active:scale-[0.98]">
                        <Send size={14} />{submitting ? '提交中...' : '提交分數'}
                      </button>
                    )
                  ) : (
                    <p className="text-xs text-neutral-500 flex items-center justify-center gap-1">
                      <Lock size={12} />登錄後可提交分數
                    </p>
                  )}
                  <button onClick={restart} className="block mx-auto mt-2 text-sm text-neutral-500 hover:text-black transition-colors">
                    重新開始
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-xs text-neutral-400 mt-3 text-center">方向鍵/WASD 移動 · 手機可滑動</p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-amber-500" />
              <h2 className="font-semibold text-black">排行榜</h2>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-sm text-neutral-500 py-6 text-center">暫無記錄，快來挑戰吧！</p>
            ) : (
              <div className="space-y-1.5">
                {leaderboard.map((entry, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${myRank && entry.person_id === (user?.personId || '') ? 'bg-black/[0.04]' : ''}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-neutral-300 text-white' : i === 2 ? 'bg-amber-200 text-amber-800' : 'bg-black/[0.04] text-neutral-500'}`}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-black flex-1 truncate">{entry.name}</span>
                    <span className="text-sm font-bold text-neutral-700">{entry.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
            {myRank && !leaderboard.some(e => e.person_id === (user?.personId || '')) && (
              <div className="mt-3 pt-3 border-t border-black/[0.06]">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black/[0.04]">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-black/[0.06] text-neutral-500">{myRank.rank}</span>
                  <span className="text-sm font-semibold text-black flex-1 truncate">{myRank.name}（你）</span>
                  <span className="text-sm font-bold text-neutral-700">{myRank.score.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
