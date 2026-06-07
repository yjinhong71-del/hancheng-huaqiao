'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X, MessageSquare } from 'lucide-react';

export default function AdminEvaluationsPage() {
  const router = useRouter();
  const [evals, setEvals] = useState<any[]>([]);
  const [l, setL] = useState(true);

  const fetchEvals = async () => {
    const r = await fetch('/api/admin-evaluations');
    if (r.status === 401) { router.push('/admin/login'); return; }
    const d = await r.json();
    if (Array.isArray(d)) setEvals(d);
    setL(false);
  };

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.isLoggedIn) router.push('/admin/login');
      else fetchEvals();
    });
  }, [router]);

  const del = async (id: string) => {
    await fetch(`/api/evaluations?id=${id}`, { method: 'DELETE' });
    setEvals(p => p.filter(e => e.id !== id));
  };

  const dims = ['appearance', 'personality', 'grades', 'talent', 'popularity'];
  const dlabels: Record<string, string> = { appearance: '外貌', personality: '性格', grades: '成绩', talent: '才艺', popularity: '人气' };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/dashboard" className="text-neutral-400 hover:text-neutral-600 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">评价管理</h1>
      </div>
      {l ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 bg-white rounded-xl border border-neutral-200/60 animate-pulse" />))}</div>
      ) : evals.length === 0 ? (
        <div className="text-center py-16"><MessageSquare size={40} className="mx-auto text-neutral-300 mb-3" /><p className="text-sm text-neutral-500">暂无评价</p></div>
      ) : (
        <div className="space-y-2">
          {evals.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl border border-neutral-200/60 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-neutral-900">{ev.evaluator_name || '早期用户'}</span>
                    <span className="text-xs text-neutral-500">→ 人物ID: {ev.person_id}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-1">
                    {dims.map(d => { const v = ev[d]; if (!v) return null; return (<span key={d} className="text-xs text-neutral-500">{dlabels[d]}: {v}</span>); })}
                  </div>
                  {ev.comment && <p className="text-sm text-neutral-700 leading-relaxed">{ev.comment}</p>}
                </div>
                <button onClick={() => del(ev.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><X size={16} /></button>
              </div>
              <div className="text-xs text-neutral-400">{new Date(ev.created_at).toLocaleString('zh-CN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
