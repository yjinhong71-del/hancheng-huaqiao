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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/70 backdrop-blur-xl border-b border-black/5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-lg font-semibold tracking-tight text-neutral-900 group-hover:text-neutral-600 transition-colors">漢城華僑</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {links.map(l => {
                const I = l.icon;
                const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
                return (
                  <Link key={l.href} href={l.href}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${active ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'}`}>
                    {I && <I size={16} />}{l.label}
                  </Link>
                );
              })}

              <div ref={langRef} className="relative ml-1">
                <button onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors">
                  <Globe size={16} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-neutral-200 shadow-lg shadow-neutral-200/50 py-1 z-50">
                      {LANG_ORDER.map(l => (
                        <button key={l} onClick={() => setLang(l)}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${lang === l ? 'text-neutral-900 bg-neutral-100 font-medium' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}>
                          {langNames[l]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user?.loggedIn ? (
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-xs text-neutral-500 font-medium px-2">{user.name}</span>
                  <button onClick={handleLogout} className="flex items-center gap-1 px-2 py-2 text-sm text-neutral-400 hover:text-red-500 rounded-lg transition-colors" title={t('nav.logout')}>
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors ml-1">
                  <LogIn size={16} />
                </Link>
              )}

              <Link href="/admin/login" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-600 rounded-lg transition-colors ml-1">
                <Shield size={16} />
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
            className="fixed inset-x-0 top-14 z-40 bg-white/90 backdrop-blur-xl border-b border-black/5 md:hidden">
            <div className="px-4 py-3 space-y-1">
              {links.map(l => {
                const I = l.icon;
                const active = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}>
                    {I && <I size={18} />}{l.label}
                  </Link>
                );
              })}
              {user?.loggedIn ? (
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={18} />{t('nav.logout')} ({user.name})
                </button>
              ) : (
                <Link href="/login" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors">
                  <LogIn size={18} />{t('nav.login')}
                </Link>
              )}
              <Link href="/admin/login" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors">
                <Shield size={18} />{t('nav.admin')}
              </Link>
              <div className="border-t border-neutral-100 pt-2 mt-2">
                <div className="text-[10px] font-medium text-neutral-400 px-3 mb-1 uppercase">{t('lang.switch')}</div>
                {LANG_ORDER.map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${lang === l ? 'text-neutral-900 bg-neutral-100' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'}`}>
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
