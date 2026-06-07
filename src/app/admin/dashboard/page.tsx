'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, MessageSquare, GraduationCap, LogOut, ArrowRight, Clock } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [s, setS] = useState({ students: 0, teachers: 0, pendingPeople: 0, suggestions: 0, unreadSuggestions: 0 });
  const [l, setL] = useState(true);

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
    });
  }, [router]);

  const hlo = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">管理后台</h1>
          <p className="text-sm text-neutral-500 mt-0.5">数据概览</p>
        </div>
        <button onClick={hlo} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
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
            <div key={ss.label} className="bg-white rounded-2xl border border-neutral-200/60 p-4 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cm[ss.color]}`}><I size={20} /></div>
              <div className="text-2xl font-bold text-neutral-900">{l ? '-' : ss.v}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{ss.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/admin/people">
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl border border-neutral-200/60 p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div><h3 className="font-semibold text-neutral-900">人物管理</h3><p className="text-sm text-neutral-500">管理学生与教师档案</p></div>
            <ArrowRight size={18} className="text-neutral-300" />
          </motion.div>
        </Link>
        <Link href="/admin/evaluations">
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl border border-neutral-200/60 p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div><h3 className="font-semibold text-neutral-900">评价管理</h3><p className="text-sm text-neutral-500">查看和删除用户评价</p></div>
            <ArrowRight size={18} className="text-neutral-300" />
          </motion.div>
        </Link>
        <Link href="/admin/suggestions">
          <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-2xl border border-neutral-200/60 p-5 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
            <div><h3 className="font-semibold text-neutral-900">建议管理</h3><p className="text-sm text-neutral-500">查看用户提交的建议</p></div>
            <ArrowRight size={18} className="text-neutral-300" />
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
