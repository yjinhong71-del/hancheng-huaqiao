'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, MessageSquare, GraduationCap, LogOut, ArrowRight, Clock, FileText } from 'lucide-react';
import { useLang } from '@/components/LanguageProvider';

export default function AdminDashboardPage() {
  const { t } = useLang();
  const router = useRouter();
  const [s, setS] = useState({ students: 0, teachers: 0, pendingPeople: 0, suggestions: 0, unreadSuggestions: 0 });
  const [l, setL] = useState(true);
  const [declaration, setDeclaration] = useState('');
  const [declarationSaved, setDeclarationSaved] = useState(false);
  const [declarationLoading, setDeclarationLoading] = useState(false);

  const fetchDeclaration = useCallback(async () => {
    try {
      const r = await fetch('/api/settings?key=site_declaration');
      const d = await r.json();
      setDeclaration(d.value || '');
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.isLoggedIn) { router.push('/admin/login'); return; }
      Promise.all([
        fetch('/api/people?type=student&status=approved').then(r => r.json()),
        fetch('/api/people?type=teacher&status=approved').then(r => r.json()),
        fetch('/api/people?status=pending').then(r => r.json()),
        fetch('/api/suggestions').then(r => r.json()),
      ])
        .then(([st, te, pending, su]) => {
          setS({
            students: Array.isArray(st) ? st.length : 0,
            teachers: Array.isArray(te) ? te.length : 0,
            pendingPeople: Array.isArray(pending) ? pending.length : 0,
            suggestions: Array.isArray(su) ? su.length : 0,
            unreadSuggestions: Array.isArray(su) ? su.filter((r: any) => !r.read).length : 0,
          });
          setL(false);
        })
        .catch(() => setL(false));
      fetchDeclaration();
    });
  }, [router, fetchDeclaration]);

  const hlo = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const saveDeclaration = async () => {
    setDeclarationLoading(true);
    await fetch('/api/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'site_declaration', value: declaration })
    });
    setDeclarationSaved(true);
    setDeclarationLoading(false);
    setTimeout(() => setDeclarationSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">管理后台</h1>
          <p className="text-sm text-neutral-500 mt-0.5">数据概览</p>
        </div>
        <button onClick={hlo} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-600 transition-colors px-3 py-2 rounded-full hover:bg-red-50">
          <LogOut size={16} />登出
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: '学生', v: s.students, icon: GraduationCap, color: 'blue' },
          { label: '教师', v: s.teachers, icon: Users, color: 'amber' },
          { label: '待审核', v: s.pendingPeople, icon: Clock, color: 'purple' },
          { label: '建议', v: s.suggestions, icon: MessageSquare, color: 'green' },
          { label: '未读建议', v: s.unreadSuggestions, icon: MessageSquare, color: 'red' },
        ].map(ss => {
          const I = ss.icon;
          const cm: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600',
            green: 'bg-green-50 text-green-600', red: 'bg-red-50 text-red-600',
            purple: 'bg-purple-50 text-purple-600',
          };
          return (
            <div key={ss.label} className="glass-card rounded-2xl p-4 hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cm[ss.color]}`}><I size={20} /></div>
              <div className="text-2xl font-bold text-neutral-900">{l ? '-' : ss.v}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{ss.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link href="/admin/people">
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2, ease: [0.22,1,0.36,1] }} className="glass-card rounded-2xl p-5 flex items-center justify-between hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer">
            <div><h3 className="font-semibold text-neutral-900">人物管理</h3><p className="text-sm text-neutral-500">管理学生与教师档案</p></div>
            <ArrowRight size={18} className="text-neutral-300" />
          </motion.div>
        </Link>
        <Link href="/admin/evaluations">
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2, ease: [0.22,1,0.36,1] }} className="glass-card rounded-2xl p-5 flex items-center justify-between hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer">
            <div><h3 className="font-semibold text-neutral-900">评价管理</h3><p className="text-sm text-neutral-500">查看、搜索和审核用户评价</p></div>
            <ArrowRight size={18} className="text-neutral-300" />
          </motion.div>
        </Link>
        <Link href="/admin/suggestions">
          <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2, ease: [0.22,1,0.36,1] }} className="glass-card rounded-2xl p-5 flex items-center justify-between hover:shadow-[0_0_0_0.5px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer">
            <div><h3 className="font-semibold text-neutral-900">建议管理</h3><p className="text-sm text-neutral-500">查看用户提交的建议</p></div>
            <ArrowRight size={18} className="text-neutral-300" />
          </motion.div>
        </Link>
      </div>

      {/* Declaration editor */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={18} className="text-neutral-400" />
          <h3 className="font-semibold text-neutral-900">{t('admin.declaration_title')}</h3>
        </div>
        <textarea value={declaration} onChange={e => setDeclaration(e.target.value)}
          placeholder="输入网站声明内容，将在首页底部展示..." rows={4}
          className="w-full px-4 py-3 text-sm bg-white/60 border border-black/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/[0.06] transition-all resize-none mb-3" />
        <div className="flex items-center gap-3">
          <button onClick={saveDeclaration} disabled={declarationLoading}
            className="px-5 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-800 disabled:opacity-40 transition-all duration-200 active:scale-[0.98]">
            {declarationLoading ? '保存中...' : t('admin.declaration_save')}
          </button>
          {declarationSaved && <span className="text-sm text-green-600">已保存</span>}
        </div>
      </div>
    </div>
  );
}
