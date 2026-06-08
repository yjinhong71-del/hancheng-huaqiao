'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle, Clock, XCircle } from 'lucide-react';
import AnimatedSection from '@/components/AnimatedSection';
import { useLang } from '@/components/LanguageProvider';

export default function LoginPage() {
  const { t } = useLang();
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [rejected, setRejected] = useState<{ reason: string } | null>(null);

  const handleLogin = async () => {
    setError('');
    setPending(false);
    setRejected(null);
    if (!name.trim() || !password) { setError('请填写姓名和密码'); return; }
    setLoading(true);
    try {
      const r = await fetch('/api/auth/user-login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password })
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || t('login.error')); setLoading(false); return; }
      if (d.status === 'pending') {
        setPending(true);
      } else if (d.status === 'rejected') {
        setRejected({ reason: d.rejection_reason || '' });
      } else if (d.status === 'approved') {
        localStorage.removeItem('seoul-hwakyoin-lang');
        window.location.href = '/students';
        return;
      } else {
        setError('账号状态异常，请联系管理员');
      }
    } catch { setError(t('register.error_network')); }
    setLoading(false);
  };

  if (pending) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <AnimatedSection>
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight mb-2">{t('login.pending_title')}</h1>
            <p className="text-sm text-neutral-500">{t('login.pending_desc')}</p>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <AnimatedSection>
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight mb-2">{t('login.rejected_title')}</h1>
            {rejected.reason && (
              <div className="mt-3 mb-4 bg-red-50 rounded-2xl p-4 text-left">
                <p className="text-xs text-red-500 font-medium mb-1">{t('login.rejected_reason')}</p>
                <p className="text-sm text-red-700">{rejected.reason}</p>
              </div>
            )}
            <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-800 transition-all duration-200 active:scale-[0.98] mt-2">
              {t('login.rejected_register')}
            </Link>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <AnimatedSection>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center mx-auto mb-3">
            <LogIn size={24} className="text-neutral-700" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t('login.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('login.desc')}</p>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">{t('login.name')}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t('login.name_placeholder')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 text-sm bg-white/60 border border-black/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/[0.06] transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1.5 block">{t('login.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.password_placeholder')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 text-sm bg-white/60 border border-black/[0.06] rounded-2xl focus:outline-none focus:ring-2 focus:ring-black/[0.06] transition-all" />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">
              <AlertCircle size={16} />{error}
            </div>
          )}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-semibold rounded-full hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]">
            {loading ? t('login.logging_in') : t('login.submit')}
          </button>
          <div className="text-center">
            <Link href="/register" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">{t('login.register_link')}</Link>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
