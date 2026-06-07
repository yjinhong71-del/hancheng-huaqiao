'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, Search, Edit3, Trash2, ArrowLeft, GraduationCap, Check, X } from 'lucide-react';
import { PersonWithStats } from '@/types';

export default function AdminPeoplePage() {
  const router = useRouter();
  const [ap, setAp] = useState<PersonWithStats[]>([]);
  const [sq, setSq] = useState('');
  const [ft, setFt] = useState<'all' | 'student' | 'teacher'>('all');
  const [st, setSt] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [l, setL] = useState(true);
  const [di, setDi] = useState<string | null>(null);

  const fpp = async () => {
    const params = new URLSearchParams();
    if (ft !== 'all') params.set('type', ft);
    params.set('status', st);
    const r = await fetch(`/api/people?${params.toString()}`);
    if (r.status === 401) { router.push('/admin/login'); return; }
    const d = await r.json();
    setAp(Array.isArray(d) ? d : []);
    setL(false);
  };

  useEffect(() => { fpp(); }, [ft, st]);
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.isLoggedIn) router.push('/admin/login');
    });
  }, [router]);

  const hd = async (id: string) => {
    await fetch(`/api/people/${id}`, { method: 'DELETE' });
    setDi(null); setAp(p => p.filter(x => x.id !== id));
  };

  const approve = async (id: string, status: 'approved' | 'rejected') => {
    await fetch('/api/people/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    setAp(p => p.filter(x => x.id !== id));
  };

  const fp = sq.trim() ? ap.filter(p => p.name.toLowerCase().includes(sq.toLowerCase()) || p.class_name.includes(sq)) : ap;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/dashboard" className="text-neutral-400 hover:text-neutral-600 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">人物管理</h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="搜索姓名或班级..." value={sq} onChange={e => setSq(e.target.value)}
              className="w-48 pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all" />
          </div>
          <div className="flex bg-neutral-100 rounded-xl p-0.5">
            {['all', 'student', 'teacher'].map(t => (
              <button key={t} onClick={() => setFt(t as typeof ft)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${ft === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                {t === 'all' ? '全部' : t === 'student' ? '学生' : '教师'}
              </button>
            ))}
          </div>
          <div className="flex bg-neutral-100 rounded-xl p-0.5">
            {[{ k: 'approved' as const, l: '已通过' }, { k: 'pending' as const, l: '待审核' }, { k: 'rejected' as const, l: '已拒绝' }].map(s => (
              <button key={s.k} onClick={() => setSt(s.k)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${st === s.k ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <Link href="/admin/people/new" className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-all">
          <Plus size={16} />新增人物
        </Link>
      </div>

      {l ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-14 bg-white rounded-xl border border-neutral-200/60 animate-pulse" />))}</div>
      ) : fp.length === 0 ? (
        <div className="text-center py-16"><GraduationCap size={40} className="mx-auto text-neutral-300 mb-3" /><p className="text-sm text-neutral-500">暂无匹配人物</p></div>
      ) : (
        <div className="space-y-1.5">
          {fp.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 ${p.status === 'pending' ? 'border-amber-200 bg-amber-50/40' : p.status === 'rejected' ? 'border-red-200 bg-red-50/30' : 'border-neutral-200/60'}`}>
              <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0">
                {p.photo_url ? <img src={p.photo_url} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400 font-medium">{p.name.charAt(0)}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-900 truncate">{p.name}</div>
                <div className="text-xs text-neutral-500">{p.type === 'student' ? `学生 · ${p.class_name}` : '教师'}
                  {p.status === 'pending' && <span className="text-amber-600 font-medium ml-1">待审核</span>}
                  {p.status === 'rejected' && <span className="text-red-500 font-medium ml-1">已拒绝</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {p.status === 'pending' && (
                  <>
                    <button onClick={() => approve(p.id, 'approved')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all" title="通过">
                      <Check size={16} />
                    </button>
                    <button onClick={() => approve(p.id, 'rejected')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="拒绝">
                      <X size={16} />
                    </button>
                  </>
                )}
                <Link href={`/admin/people/${p.id}/edit`} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  <Edit3 size={16} />
                </Link>
                {di === p.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => hd(p.id)} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">确认</button>
                    <button onClick={() => setDi(null)} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700">取消</button>
                  </div>
                ) : (
                  <button onClick={() => setDi(p.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
