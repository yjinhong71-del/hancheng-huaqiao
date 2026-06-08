'use client';
import Link from 'next/link'; import { motion } from 'framer-motion'; import { PersonWithStats } from '@/types';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
export default function PersonCard({ person, index }: { person: PersonWithStats; index: number }) {
  const showStats = person.like_count > 0 || person.dislike_count > 0 || person.evaluation_count > 0;
  return (<motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22,1,0.36,1] }}>
    <Link href={`/person/${person.id}`}>
      <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15, ease: [0.22,1,0.36,1] }} className="group relative glass-card rounded-2xl overflow-hidden">
        <div className="aspect-[4/5] bg-black/[0.02] overflow-hidden">
          {person.photo_url ? (
            <div className="relative w-full h-full">
              <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (<div className="w-full h-full flex items-center justify-center"><div className="w-16 h-16 rounded-full bg-black/[0.04] flex items-center justify-center"><span className="text-2xl text-neutral-400 font-medium">{person.name.charAt(0)}</span></div></div>)}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-1"><h3 className="font-bold text-black text-sm tracking-tight truncate">{person.name}</h3>{person.type === 'teacher' ? (<span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0 ml-1">教师</span>) : (<span className="text-[10px] font-semibold text-neutral-600 bg-black/[0.04] px-1.5 py-0.5 rounded-full shrink-0 ml-1">{person.class_name}</span>)}</div>
          <div className="flex items-center gap-1.5 mb-1.5"><Star size={12} fill="#f5a623" stroke="#f5a623" /><span className="text-xs font-bold text-neutral-800">{person.overall_avg > 0 ? person.overall_avg.toFixed(1) : '-'}</span></div>
          {showStats && (
            <div className="flex items-center gap-3 text-[11px] text-neutral-500"><span className="flex items-center gap-1"><ThumbsUp size={11} />{person.like_count}</span><span className="flex items-center gap-1"><ThumbsDown size={11} />{person.dislike_count}</span><span className="flex items-center gap-1"><MessageSquare size={11} />{person.evaluation_count}</span></div>
          )}
        </div>
      </motion.div>
    </Link>
  </motion.div>);
}
