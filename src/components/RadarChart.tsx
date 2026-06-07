'use client';
import { useRef, useState, useEffect } from 'react'; import { motion, useInView } from 'framer-motion';
import { DIMENSION_LABELS } from '@/types'; import { useLang } from '@/components/LanguageProvider';
export default function RadarChart({ data, size = 220 }: { data: Record<string, number>; size?: number }) {
  const { lang } = useLang();
  const dlabel = (dim: string) => { const e = DIMENSION_LABELS[dim as keyof typeof DIMENSION_LABELS]; return e ? (e[lang] || e['zh-CN']) : dim; };
  const ref = useRef<HTMLDivElement>(null); const inv = useInView(ref, { once: true, margin: '-50px' });
  const [anim, setAnim] = useState(false);
  useEffect(() => { if (inv) setAnim(true); }, [inv]);
  const dims = ['appearance','personality','grades','talent','popularity'];
  const c = size/2; const r = (size/2)*0.7; const as = (2*Math.PI)/5;
  const gp = (i: number, v: number, mr?: number) => { const R = mr ?? r; const a = as*i - Math.PI/2; const V = (v/5)*R; return { x: c+V*Math.cos(a), y: c+V*Math.sin(a) }; };
  const grid = [1,2,3,4,5].map(lv => dims.map((_,i) => { const p = gp(i,lv); return `${p.x},${p.y}`; }).join(' '));
  const axes = dims.map((_,i) => { const p = gp(i,5); return { x1:c,y1:c,x2:p.x,y2:p.y }; });
  const dpts = dims.map((dim,i) => { const v = anim ? (data[dim]||0) : 0; return gp(i,v); });
  const dPath = dpts.map((p,i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const avg = anim ? Object.values(data).reduce((s,v)=>s+v,0) : 0;
  const avgShow = avg > 0 ? (avg / Object.values(data).length).toFixed(1) : '-';
  return (<div ref={ref} className="relative inline-flex items-center justify-center" style={{ width:size, height:size }}>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {grid.map((p,i) => (<polygon key={`g${i}`} points={p} fill="none" stroke={i===4?'#e5e5e5':'#f0f0f0'} strokeWidth={i===4?1:0.5} />))}
      {axes.map((l,i) => (<line key={`a${i}`} {...l} stroke="#e5e5e5" strokeWidth={0.5} />))}
      <motion.path d={dPath} fill="rgba(59,130,246,0.08)" stroke="#3b82f6" strokeWidth={1.5} initial={{ pathLength:0, opacity:0 }} animate={anim?{ pathLength:1, opacity:1 }:{}} transition={{ duration:0.8, ease:'easeInOut' }} />
      {dpts.map((p,i) => (<motion.circle key={`d${i}`} cx={p.x} cy={p.y} r={3} fill="#3b82f6" initial={{ scale:0 }} animate={anim?{ scale:1 }:{}} transition={{ duration:0.3, delay:0.5+i*0.1 }} />))}
    </svg>
    {dims.map((dim,i) => { const lp = gp(i,6.2); return (<span key={dim} className="absolute text-[10px] font-medium text-neutral-500 pointer-events-none" style={{ left:lp.x, top:lp.y, transform:'translate(-50%,-50%)' }}>{dlabel(dim)}</span>); })}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><motion.div initial={{ opacity:0, scale:0.5 }} animate={anim?{ opacity:1, scale:1 }:{}} transition={{ duration:0.4, delay:0.7 }} className="text-center"><div className="text-2xl font-bold text-neutral-900">{avgShow}</div><div className="text-[10px] text-neutral-400">{dlabel('综合')}</div></motion.div></div>
  </div>);
}
