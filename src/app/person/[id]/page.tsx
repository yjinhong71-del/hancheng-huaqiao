'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Star, MessageSquare, ArrowLeft, ChevronRight, Lock } from 'lucide-react';
import RadarChart from '@/components/RadarChart';
import RatingStars from '@/components/RatingStars';
import AnimatedSection from '@/components/AnimatedSection';
import { PersonWithStats, Evaluation, DIMENSION_LABELS } from '@/types';
import { useLang } from '@/components/LanguageProvider';

export default function PersonDetailPage() {
  const { t, lang } = useLang();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [p, setP] = useState<PersonWithStats | null>(null);
  const [evs, setEvs] = useState<Evaluation[]>([]);
  const [l, setL] = useState(true);
  const [uv, setUv] = useState<'like' | 'dislike' | null>(null);
  const [lc, setLc] = useState(0);
  const [dc, setDc] = useState(0);
  const [sf, setSf] = useState(false);
  const [es, setEs] = useState<Record<string, number>>({ appearance: 0, personality: 0, grades: 0, talent: 0, popularity: 0 });
  const [ec, setEc] = useState('');
  const [sb, setSb] = useState(false);
  const [eok, setEok] = useState(false);
  const [user, setUser] = useState<{ loggedIn: boolean; personId?: string; name?: string; status?: string } | null>(null);

  const dlabel = (dim: string) => {
    const entry = DIMENSION_LABELS[dim as keyof typeof DIMENSION_LABELS];
    return entry ? (entry[lang] || entry['zh-CN']) : dim;
  };

  const fp = useCallback(async () => {
    const r = await fetch(`/api/people/${id}`);
    if (!r.ok) { router.push('/'); return; }
    const d = await r.json();
    setP(d);
    setLc(d.like_count);
    setDc(d.dislike_count);
    setL(false);
  }, [id, router]);

  const fe = useCallback(async () => {
    const r = await fetch(`/api/evaluations?personId=${id}`);
    if (r.ok) {
      const d = await r.json();
      if (Array.isArray(d)) setEvs(d);
    }
  }, [id]);

  const fuser = useCallback(async () => {
    const r = await fetch('/api/auth/user-session');
    const d = await r.json();
    setUser(d);
  }, []);

  useEffect(() => { fp(); fuser(); }, [fp, fuser]);
  useEffect(() => {
    if (user?.loggedIn && user.status === 'approved') fe();
  }, [user]);

  const hv = async (ty: 'like' | 'dislike') => {
    const r = await fetch('/api/likes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_id: id, type: ty })
    });
    const d = await r.json();
    setLc(d.like_count);
    setDc(d.dislike_count);
    setUv(d.user_vote);
  };

  const hse = async () => {
    setSb(true);
    const r = await fetch('/api/evaluations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_id: id, ...es, comment: ec })
    });
    if (r.ok) {
      setEok(true); setSf(false);
      setTimeout(() => { fe(); fp(); setEok(false); setEs({ appearance: 0, personality: 0, grades: 0, talent: 0, popularity: 0 }); setEc(''); }, 1500);
    }
    setSb(false);
  };

  if (l) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-neutral-100 rounded w-24" />
        <div className="flex gap-6"><div className="w-48 h-48 bg-neutral-100 rounded-2xl" /><div className="flex-1 space-y-3"><div className="h-8 bg-neutral-100 rounded w-32" /><div className="h-4 bg-neutral-100 rounded w-48" /></div></div>
      </div>
    </div>
  );
  if (!p) return null;

  const rd = { appearance: p.avg_appearance || 0, personality: p.avg_personality || 0, grades: p.avg_grades || 0, talent: p.avg_talent || 0, popularity: p.avg_popularity || 0 };
  const canEval = user?.loggedIn && user.status === 'approved';
  const canView = user?.loggedIn && user.status === 'approved';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      <motion.button initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} onClick={() => router.back()} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-6">
        <ArrowLeft size={16} />{t('person.back')}
      </motion.button>

      <AnimatedSection>
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-neutral-100 overflow-hidden shrink-0">
              {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center"><span className="text-4xl text-neutral-400 font-bold">{p.name.charAt(0)}</span></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.type === 'teacher' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                  {p.type === 'teacher' ? t('person.teacher') : t('person.student')}
                </span>
                {p.class_name && <span className="text-xs text-neutral-500">{p.class_name}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mb-1">{p.name}</h1>
              {p.bio && <p className="text-sm text-neutral-500 leading-relaxed mt-2 max-w-md">{p.bio}</p>}
              <div className="flex items-center gap-2 mt-4">
                <Star size={20} fill="#f5a623" stroke="#f5a623" />
                <span className="text-xl font-bold text-neutral-900">{p.overall_avg > 0 ? p.overall_avg.toFixed(1) : '-'}</span>
                <span className="text-sm text-neutral-400">({p.evaluation_count} {t('person.eval_count')})</span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => hv('like')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all ${uv === 'like' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'}`}>
                  <ThumbsUp size={16} fill={uv === 'like' ? '#2563eb' : 'none'} />{t('person.like')} {lc}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} onClick={() => hv('dislike')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all ${uv === 'dislike' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-neutral-50 text-neutral-600 border border-neutral-200 hover:bg-neutral-100'}`}>
                  <ThumbsDown size={16} fill={uv === 'dislike' ? '#dc2626' : 'none'} />{t('person.dislike')} {dc}
                </motion.button>
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center shrink-0"><RadarChart data={rd} size={200} /></div>
          </div>
          <div className="sm:hidden flex justify-center mt-6"><RadarChart data={rd} size={180} /></div>
        </div>
      </AnimatedSection>

      {canView ? (
        <>
          <AnimatedSection delay={0.1}>
            <div className="mt-6 bg-white rounded-2xl border border-neutral-200/60 p-5">
              <h2 className="text-sm font-semibold text-neutral-700 mb-4">{t('person.dimensions')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {['appearance', 'personality', 'grades', 'talent', 'popularity'].map(d => (
                  <div key={d} className="text-center">
                    <div className="text-xs text-neutral-500 mb-1">{dlabel(d)}</div>
                    <div className="text-xl font-bold text-neutral-800">{rd[d as keyof typeof rd] > 0 ? rd[d as keyof typeof rd].toFixed(1) : '-'}</div>
                    <RatingStars value={Math.round(rd[d as keyof typeof rd])} readonly size={14} />
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.15}>
            <div className="mt-6 bg-white rounded-2xl border border-neutral-200/60 p-5">
              {!sf ? (
                <button onClick={() => setSf(true)} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  <MessageSquare size={16} />{t('person.write_eval')}<ChevronRight size={16} />
                </button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                  {eok ? (
                    <div className="text-center py-4"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-green-600 text-lg font-semibold">{t('person.eval_success')}</motion.div></div>
                  ) : (
                    <>
                      <h3 className="text-sm font-semibold text-neutral-700">{t('person.submit_eval')}</h3>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3"><p className="text-xs text-amber-700 leading-relaxed">{t('person.disclaimer')}</p></div>
                      {Object.entries(DIMENSION_LABELS).map(([k]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600">{dlabel(k)}</span>
                          <RatingStars value={es[k] || 0} onChange={v => setEs(pv => ({ ...pv, [k]: v }))} size={18} />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-neutral-500 mb-1.5 block">{t('person.comment_label')}</label>
                        <textarea value={ec} onChange={e => setEc(e.target.value)} placeholder={t('person.comment_placeholder')} rows={3} maxLength={500}
                          className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:border-neutral-300 transition-all resize-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={hse} disabled={sb} className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                          {sb ? t('person.submitting') : t('person.submit_btn')}
                        </button>
                        <button onClick={() => setSf(false)} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">{t('person.cancel')}</button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('person.evaluations')} <span className="text-neutral-400 font-normal text-sm">{evs.length} {t('person.eval_count')}</span></h2>
              {evs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-neutral-200/60 p-8 text-center">
                  <MessageSquare size={32} className="mx-auto text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-500">{t('person.no_eval')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evs.map((ei, i) => (
                    <motion.div key={ei.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-neutral-200/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-neutral-700">{ei.evaluator_name || t('person.early_user')}</span>
                        <span className="text-xs text-neutral-400">{new Date(ei.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        {['appearance', 'personality', 'grades', 'talent', 'popularity'].map(d => {
                          const v = ei[d as keyof typeof ei] as number;
                          if (!v) return null;
                          return (<div key={d} className="flex items-center gap-1"><span className="text-[10px] text-neutral-400">{dlabel(d)}</span><span className="text-xs font-semibold text-neutral-700">{v}</span></div>);
                        })}
                      </div>
                      {ei.comment && <p className="text-sm text-neutral-600 leading-relaxed">{ei.comment}</p>}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </AnimatedSection>
        </>
      ) : (
        <AnimatedSection delay={0.1}>
          <div className="mt-6 bg-white rounded-2xl border border-neutral-200/60 p-8 text-center">
            <Lock size={40} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">{t('person.login_to_view')}</h3>
            <p className="text-sm text-neutral-500 mb-5">{t('person.login_to_view_desc')}</p>
            <button onClick={() => router.push('/login')} className="px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-all">
              {t('person.login_btn')}
            </button>
          </div>
        </AnimatedSection>
      )}
    </div>
  );
}
