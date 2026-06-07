'use client';
import Link from 'next/link'; import { motion } from 'framer-motion'; import { PersonWithStats } from '@/types';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
export default function PersonCard({ person, index }: { person: PersonWithStats; index: number }) {
  return (<motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22,1,0.36,1] }}>
    <Link href={`/person/${person.id}`}>
      <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="group relative bg-white rounded-2xl border border-neutral-200/60 overflow-hidden hover:shadow-lg hover:shadow-neutral-200/50 hover:border-neutral-300/60 transition-shadow duration-300">
        <div className="aspect-[3/4] bg-neutral-100 overflow-hidden">
          {person.photo_url ? (<img src={person.photo_url} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />) : (<div className="w-full h-full flex items-center justify-center"><div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center"><span className="text-2xl text-neutral-400 font-medium">{person.name.charAt(0)}</span></div></div>)}
        </div>
        <div className="p-3.5">
          <div className="flex items-center justify-between mb-1"><h3 className="font-semibold text-neutral-900 text-sm tracking-tight truncate">{person.name}</h3>{person.type === 'teacher' ? (<span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">教师</span>) : (<span className="text-[10px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-full">{person.class_name}</span>)}</div>
          <div className="flex items-center gap-1.5 mb-1.5"><Star size={12} fill="#f5a623" stroke="#f5a623" /><span className="text-xs font-semibold text-neutral-700">{person.overall_avg > 0 ? person.overall_avg.toFixed(1) : '-'}</span></div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-400"><span className="flex items-center gap-1"><ThumbsUp size={11} />{person.like_count}</span><span className="flex items-center gap-1"><ThumbsDown size={11} />{person.dislike_count}</span><span className="flex items-center gap-1"><MessageSquare size={11} />{person.evaluation_count}</span></div>
        </div>
      </motion.div>
    </Link>
  </motion.div>);
}
