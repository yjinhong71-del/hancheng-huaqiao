export interface Person {
  id: string;
  name: string;
  type: 'student' | 'teacher';
  class_name: string;
  photo_url: string;
  bio: string;
  password_hash?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonWithStats extends Person {
  avg_appearance: number;
  avg_personality: number;
  avg_grades: number;
  avg_talent: number;
  avg_popularity: number;
  overall_avg: number;
  like_count: number;
  dislike_count: number;
  evaluation_count: number;
}

export interface Evaluation {
  id: string;
  person_id: string;
  evaluator_id: string | null;
  evaluator_name?: string;
  appearance: number;
  personality: number;
  grades: number;
  talent: number;
  popularity: number;
  comment: string;
  is_anonymous: number;
  created_at: string;
}

export interface Suggestion {
  id: string;
  content: string;
  contact: string;
  created_at: string;
  read: number;
}

export type Language = 'zh-CN' | 'zh-TW' | 'en' | 'ko';

export const DIMENSION_LABELS: Record<string, Record<Language, string>> = {
  appearance: { 'zh-CN': '外貌', 'zh-TW': '外貌', en: 'Appearance', ko: '외모' },
  personality: { 'zh-CN': '性格', 'zh-TW': '性格', en: 'Personality', ko: '성격' },
  grades: { 'zh-CN': '成绩', 'zh-TW': '成績', en: 'Grades', ko: '성적' },
  talent: { 'zh-CN': '才艺', 'zh-TW': '才藝', en: 'Talent', ko: '재능' },
  popularity: { 'zh-CN': '人气', 'zh-TW': '人氣', en: 'Popularity', ko: '인기' },
};

export const TEACHER_DIMENSION_LABELS: Record<string, Record<Language, string>> = {
  appearance: { 'zh-CN': '外貌', 'zh-TW': '外貌', en: 'Appearance', ko: '외모' },
  personality: { 'zh-CN': '严厉程度', 'zh-TW': '嚴厲程度', en: 'Strictness', ko: '엄격함' },
  grades: { 'zh-CN': '教学能力', 'zh-TW': '教學能力', en: 'Teaching', ko: '교수능력' },
  talent: { 'zh-CN': '才艺', 'zh-TW': '才藝', en: 'Talent', ko: '재능' },
  popularity: { 'zh-CN': '人气', 'zh-TW': '人氣', en: 'Popularity', ko: '인기' },
};

export const CLASS_LIST = [
  '高一1班','高一2班','高一3班','高一4班',
  '高二1班','高二2班','高二3班','高二4班',
  '高三1班','高三2班','高三3班','高三4班',
];

export const GRADE_GROUPS: Record<string, string[]> = {
  '高一': ['高一1班','高一2班','高一3班','高一4班'],
  '高二': ['高二1班','高二2班','高二3班','高二4班'],
  '高三': ['高三1班','高三2班','高三3班','高三4班'],
};
