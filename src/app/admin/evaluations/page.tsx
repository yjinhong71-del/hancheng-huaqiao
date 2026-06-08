'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, X, Search, Check, EyeOff, MessageSquare } from 'lucide-react';
import { useLang } from '@/components/LanguageProvider';

export default function AdminEvaluationsPage() {
  const { t } = useLang();
  const router = useRouter();
  const [evals, setEvals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [l, setL] = useState(true);

  const fetchEvals = async (q?: string) => {
    const url = q ? `/api/admin-evaluations?search=${encodeURIComponent(q)}` : '/api/admin-evaluations';
    const r = await fetch(url);
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

  useEffect(() => {
    const t = setTimeout(() => fetchEvals(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const del = async (id: string) => {
    await fetch(`/api/evaluations?id=${id}`, { method: 'DELETE' });
    setEvals(p => p.filter(e => e.id !== id));
  };

  const toggleApprove = async (id: string, approved: boolean) => {
    await fetch('/api/evaluations', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, approved: approved ? 1 : 0 })
    });
    setEvals(p => p.map(e => e.id === id ? { ...e, approved: approved ? 1 : 0 } : e));
  };

  const dims = ['appearance', 'personality', 'grades', 'talent', 'popularity'];
  const dlabels: Record<string, string> = { appearance: '外貌', personality: '性格', grades: '成绩', talent: '才艺', popularity: '人气' };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/dashboard" className="text-neutral-400 hover:text-neutral-600 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">评价管理</h1>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input type="text" placeholder={t('admin.eval_search')} value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 text-sm glass-card rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/[0.06] transition-all" />
      </div>

      {l ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-28 glass-card rounded-2xl animate-shimmer" />))}</div>
      ) : evals.length === 0 ? (
        <div className="text-center py-16"><MessageSquare size={40} className="mx-auto text-neutral-300 mb-3" /><p className="text-sm text-neutral-500">暂无评价</p></div>
      ) : (
        <div className="space-y-2">
          {evals.map(ev => (
            <div key={ev.id} className={`glass-card rounded-2xl p-4 transition-all duration-200 ${!ev.approved ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-neutral-900">{ev.evaluator_name || '早期用户'}</span>
                    {ev.is_anonymous ? <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{t('admin.eval_anonymous_badge')}</span> : null}
                    <span className="text-xs text-neutral-400">→</span>
                    <span className="text-sm font-semibold text-neutral-900">{ev.target_name || ev.person_id}</span>
                    <span className="text-[10px] text-neutral-400 bg-black/[0.03] px-1.5 py-0.5 rounded-full">{ev.target_type === 'teacher' ? '教师' : '学生'}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    {dims.map(d => { const v = ev[d]; if (!v) return null; return (<span key={d} className="text-xs text-neutral-500">{dlabels[d]}: {v}</span>); })}
                  </div>
                  {ev.comment && <p className="text-sm text-neutral-700 leading-relaxed break-words">{ev.comment}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleApprove(ev.id, !ev.approved)}
                    className={`p-1.5 rounded-lg transition-all ${ev.approved ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-amber-50 hover:text-amber-600'}`}
                    title={ev.approved ? t('admin.eval_unapprove') : t('admin.eval_approve')}>
                    {ev.approved ? <Check size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => del(ev.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><X size={16} /></button>
                </div>
              </div>
              <div className="text-xs text-neutral-400">{new Date(ev.created_at).toLocaleString('zh-CN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
