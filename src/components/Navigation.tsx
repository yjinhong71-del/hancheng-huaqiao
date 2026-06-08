'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, Users, UserPlus, MessageSquare, Edit3, Shield, Globe, LogIn, LogOut } from 'lucide-react';
import { useLang, LANG_ORDER } from '@/components/LanguageProvider';
import { Language } from '@/types';

const langNames: Record<Language, string> = { 'zh-CN': '简体中文', 'zh-TW': '繁體中文', en: 'English', ko: '한국어' };

export default function Navigation() {
  const { t, lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ loggedIn: boolean; name?: string } | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/user-session');
      const d = await r.json();
      setUser({ loggedIn: d.loggedIn, name: d.name });
    } catch { setUser(null); }
  }, []);

  useEffect(() => { fetchUser(); }, [pathname, fetchUser]);

  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  useEffect(() => { setMobileOpen(false); setLangOpen(false); }, [pathname]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/user-logout', { method: 'POST' });
    setUser({ loggedIn: false });
    router.push('/');
  };

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/students', label: t('nav.students'), icon: GraduationCap },
    { href: '/teachers', label: t('nav.teachers'), icon: Users },
    { href: '/register', label: t('nav.register'), icon: UserPlus },
    { href: '/edit-profile', label: t('nav.edit'), icon: Edit3 },
    { href: '/suggest', label: t('nav.suggest'), icon: MessageSquare },
  ];

  return (
    <>
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 transition-colors duration-500 ${scrolled ? 'glass-nav rounded-full shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_2px_12px_rgba(0,0,0,0.08)]' : 'bg-transparent'}`}>
        <div className="px-4">
          <div className="flex items-center justify-between h-11 gap-2">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <span className="text-[15px] font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-500 transition-colors">漢城華僑</span>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {links.map(l => {
                const I = l.icon;
                const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
                return (
                  <Link key={l.href} href={l.href}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-full transition-colors duration-150 ${active ? 'text-neutral-900 bg-black/[0.05]' : 'text-neutral-500 hover:text-black hover:bg-black/[0.03]'}`}>
                    {I && <I size={15} />}{l.label}
                  </Link>
                );
              })}

              <div ref={langRef} className="relative">
                <button onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 text-[13px] font-medium text-neutral-400 hover:text-neutral-600 rounded-full transition-colors">
                  <Globe size={15} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-36 glass-card rounded-xl py-1 z-50">
                      {LANG_ORDER.map(l => (
                        <button key={l} onClick={() => setLang(l)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${lang === l ? 'text-neutral-900 bg-black/[0.04] font-medium' : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/[0.02]'}`}>
                          {langNames[l]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user?.loggedIn ? (
                <div className="flex items-center gap-0.5">
                  <span className="text-[11px] text-neutral-500 font-medium px-2">{user.name}</span>
                  <button onClick={handleLogout} className="flex items-center gap-1 px-2 py-1.5 text-[13px] text-neutral-400 hover:text-red-500 rounded-full transition-colors" title={t('nav.logout')}>
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-neutral-500 hover:text-black hover:bg-black/[0.03] rounded-full transition-colors duration-150">
                  <LogIn size={15} />
                </Link>
              )}

              <Link href="/admin/login" className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] font-medium text-neutral-400 hover:text-neutral-600 rounded-full transition-colors">
                <Shield size={15} />
              </Link>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 transition-colors">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 glass-card mx-4 rounded-2xl md:hidden">
            <div className="px-4 py-3 space-y-1">
              {links.map(l => {
                const I = l.icon;
                const active = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'text-neutral-900 bg-black/[0.04]' : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/[0.02]'}`}>
                    {I && <I size={18} />}{l.label}
                  </Link>
                );
              })}
              {user?.loggedIn ? (
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={18} />{t('nav.logout')} ({user.name})
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-black/[0.02] transition-colors">
                  <LogIn size={18} />{t('nav.login')}
                </Link>
              )}
              <Link href="/admin/login" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-black/[0.02] transition-colors">
                <Shield size={18} />{t('nav.admin')}
              </Link>
              <div className="border-t border-black/[0.04] pt-2 mt-2">
                <div className="text-[10px] font-medium text-neutral-400 px-3 mb-1 uppercase">{t('lang.switch')}</div>
                {LANG_ORDER.map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${lang === l ? 'text-neutral-900 bg-black/[0.04]' : 'text-neutral-500 hover:text-neutral-900 hover:bg-black/[0.02]'}`}>
                    {langNames[l]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
