'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/types';

interface LangContextType { lang: Language; setLang: (l: Language) => void; t: (key: string) => string; }
const LangContext = createContext<LangContextType>({ lang: 'zh-TW', setLang: () => {}, t: (k) => k });
export function useLang() { return useContext(LangContext); }

const STORAGE_KEY = 'seoul-hwakyoin-lang';

// Multi-language dictionary - proper translations
const dict: Record<string, Record<Language, string>> = {
  'site.title': { 'zh-CN': '汉城华侨中学', 'zh-TW': '漢城華僑中學', en: 'Seoul Overseas Chinese High School', ko: '한성화교중학교' },
  'site.subtitle': { 'zh-CN': '人物评价', 'zh-TW': '人物評價', en: 'Character Reviews', ko: '인물 평가' },
  'site.tagline': { 'zh-CN': 'Seoul Overseas Chinese High School', 'zh-TW': 'Seoul Overseas Chinese High School', en: 'Seoul Overseas Chinese High School', ko: 'Seoul Overseas Chinese High School' },
  'site.description': { 'zh-CN': '发现你身边最真实的人物评价。', 'zh-TW': '發現你身邊最真實的人物評價。', en: 'Discover the most authentic character reviews around you.', ko: '당신 주변의 가장 진실된 인물 평가를 발견하세요.' },
  'nav.home': { 'zh-CN': '首页', 'zh-TW': '首頁', en: 'Home', ko: '홈' },
  'nav.students': { 'zh-CN': '学生', 'zh-TW': '學生', en: 'Students', ko: '학생' },
  'nav.teachers': { 'zh-CN': '教师', 'zh-TW': '教師', en: 'Teachers', ko: '교사' },
  'nav.register': { 'zh-CN': '入驻', 'zh-TW': '入駐', en: 'Join', ko: '등록' },
  'nav.edit': { 'zh-CN': '编辑档案', 'zh-TW': '編輯檔案', en: 'Edit Profile', ko: '프로필 편집' },
  'nav.suggest': { 'zh-CN': '建议', 'zh-TW': '建議', en: 'Feedback', ko: '제안' },
  'home.hero.students': { 'zh-CN': '学生档案', 'zh-TW': '學生檔案', en: 'Student Profiles', ko: '학생 프로필' },
  'home.hero.students_desc': { 'zh-CN': '按班级浏览学生人物评价', 'zh-TW': '按班級瀏覽學生人物評價', en: 'Browse student reviews by class', ko: '반별로 학생 평가 보기' },
  'home.hero.teachers': { 'zh-CN': '教师档案', 'zh-TW': '教師檔案', en: 'Teacher Profiles', ko: '교사 프로필' },
  'home.hero.teachers_desc': { 'zh-CN': '浏览教师人物评价', 'zh-TW': '瀏覽教師人物評價', en: 'Browse teacher reviews', ko: '교사 평가 보기' },
  'home.featured': { 'zh-CN': '精选人物', 'zh-TW': '精選人物', en: 'Featured', ko: '주목 인물' },
  'home.featured_desc': { 'zh-CN': '看看大家都在评价谁', 'zh-TW': '看看大家都在評價誰', en: 'See who everyone is talking about', ko: '모두가 주목하는 인물' },
  'home.featured_all': { 'zh-CN': '查看全部', 'zh-TW': '查看全部', en: 'View All', ko: '전체 보기' },
  'home.cta': { 'zh-CN': '还没有你的档案？', 'zh-TW': '還沒有你的檔案？', en: "Don't have a profile yet?", ko: '아직 프로필이 없으신가요?' },
  'home.cta_desc': { 'zh-CN': '创建你的个人档案，接受来自全校的真实评价。', 'zh-TW': '創建你的個人檔案，接受來自全校的真實評價。', en: 'Create your profile and receive authentic reviews.', ko: '프로필을 만들고 전교생의 평가를 받아보세요.' },
  'home.cta_btn': { 'zh-CN': '立即入驻', 'zh-TW': '立即入駐', en: 'Join Now', ko: '지금 등록' },
  'home.cta_browse': { 'zh-CN': '浏览学生', 'zh-TW': '瀏覽學生', en: 'Browse Students', ko: '학생 둘러보기' },
  'home.cta_register': { 'zh-CN': '入驻档案', 'zh-TW': '入駐檔案', en: 'Join', ko: '프로필 등록' },
  'home.brand': { 'zh-CN': '人物评价平台', 'zh-TW': '人物評價平台', en: 'Character Review Platform', ko: '인물 평가 플랫폼' },
  'home.footer_suggest': { 'zh-CN': '提交建议', 'zh-TW': '提交建議', en: 'Feedback', ko: '제안하기' },
  'home.footer_register': { 'zh-CN': '入驻档案', 'zh-TW': '入駐檔案', en: 'Join', ko: '프로필 등록' },
  'students.title': { 'zh-CN': '学生档案', 'zh-TW': '學生檔案', en: 'Student Profiles', ko: '학생 프로필' },
  'students.heading': { 'zh-CN': '学生人物评价', 'zh-TW': '學生人物評價', en: 'Student Reviews', ko: '학생 인물 평가' },
  'students.desc': { 'zh-CN': '按年级浏览学生档案', 'zh-TW': '按年級瀏覽學生檔案', en: 'Browse students by grade', ko: '학년별로 학생 보기' },
  'students.search': { 'zh-CN': '搜索姓名或班级...', 'zh-TW': '搜尋姓名或班級...', en: 'Search name or class...', ko: '이름 또는 반 검색...' },
  'students.empty': { 'zh-CN': '暂无学生档案', 'zh-TW': '暫無學生檔案', en: 'No students yet', ko: '아직 학생이 없습니다' },
  'students.first': { 'zh-CN': '成为第一个入驻的学生 →', 'zh-TW': '成為第一個入駐的學生 →', en: 'Be the first student to join →', ko: '첫 번째 학생으로 등록하기 →' },
  'teachers.title': { 'zh-CN': '教师档案', 'zh-TW': '教師檔案', en: 'Teacher Profiles', ko: '교사 프로필' },
  'teachers.heading': { 'zh-CN': '教师人物评价', 'zh-TW': '教師人物評價', en: 'Teacher Reviews', ko: '교사 인물 평가' },
  'teachers.desc': { 'zh-CN': '浏览教师人物评价', 'zh-TW': '瀏覽教師人物評價', en: 'Browse teacher reviews', ko: '교사 평가 보기' },
  'teachers.search': { 'zh-CN': '搜索教师姓名...', 'zh-TW': '搜尋教師姓名...', en: 'Search teacher name...', ko: '교사 이름 검색...' },
  'teachers.empty': { 'zh-CN': '暂无教师档案', 'zh-TW': '暫無教師檔案', en: 'No teachers yet', ko: '아직 교사가 없습니다' },
  'teachers.first': { 'zh-CN': '成为第一个入驻的教师 →', 'zh-TW': '成為第一個入駐的教師 →', en: 'Be the first teacher to join →', ko: '첫 번째 교사로 등록하기 →' },
  'person.back': { 'zh-CN': '返回', 'zh-TW': '返回', en: 'Back', ko: '뒤로' },
  'person.student': { 'zh-CN': '学生', 'zh-TW': '學生', en: 'Student', ko: '학생' },
  'person.teacher': { 'zh-CN': '教师', 'zh-TW': '教師', en: 'Teacher', ko: '교사' },
  'person.dimensions': { 'zh-CN': '评分维度', 'zh-TW': '評分維度', en: 'Rating Dimensions', ko: '평가 항목' },
  'person.eval_count': { 'zh-CN': '条评价', 'zh-TW': '條評價', en: 'reviews', ko: '개의 평가' },
  'person.like': { 'zh-CN': '赞', 'zh-TW': '讚', en: 'Like', ko: '좋아요' },
  'person.dislike': { 'zh-CN': '踩', 'zh-TW': '踩', en: 'Dislike', ko: '싫어요' },
  'person.write_eval': { 'zh-CN': '写下你的评价', 'zh-TW': '寫下你的評價', en: 'Write a Review', ko: '평가 작성하기' },
  'person.submit_eval': { 'zh-CN': '发表评价', 'zh-TW': '發表評價', en: 'Submit Review', ko: '평가 제출' },
  'person.nickname': { 'zh-CN': '你的昵称', 'zh-TW': '你的暱稱', en: 'Your Nickname', ko: '닉네임' },
  'person.nickname_placeholder': { 'zh-CN': '输入昵称...', 'zh-TW': '輸入暱稱...', en: 'Enter nickname...', ko: '닉네임 입력...' },
  'person.comment_label': { 'zh-CN': '评论（选填）', 'zh-TW': '評論（選填）', en: 'Comment (optional)', ko: '코멘트 (선택)' },
  'person.comment_placeholder': { 'zh-CN': '说点什么...', 'zh-TW': '說點什麼...', en: 'Say something...', ko: '한마디...' },
  'person.cancel': { 'zh-CN': '取消', 'zh-TW': '取消', en: 'Cancel', ko: '취소' },
  'person.submit_btn': { 'zh-CN': '提交评价', 'zh-TW': '提交評價', en: 'Submit', ko: '제출' },
  'person.submitting': { 'zh-CN': '提交中...', 'zh-TW': '提交中...', en: 'Submitting...', ko: '제출 중...' },
  'person.eval_success': { 'zh-CN': '评价已提交，等待审核后展示', 'zh-TW': '評價已提交，等待審核後展示', en: 'Review submitted, pending moderation', ko: '평가 제출 완료, 검토 후 표시됩니다' },
  'person.no_eval': { 'zh-CN': '暂无评价，来写第一条吧', 'zh-TW': '暫無評價，來寫第一條吧', en: 'No reviews yet, be the first!', ko: '아직 평가가 없습니다. 첫 평가를 작성해보세요!' },
  'person.evaluations': { 'zh-CN': '评价', 'zh-TW': '評價', en: 'Reviews', ko: '평가' },
  'person.disclaimer': { 'zh-CN': '⚠️ 为防止不当内容，所有评论需经管理员审核后方可展示。请勿在评论区辱骂或侮辱他人，违者将不予通过。', 'zh-TW': '⚠️ 為防止不當內容，所有評論需經管理員審核後方可展示。請勿在評論區辱罵或侮辱他人，違者將不予通過。', en: '⚠️ To prevent inappropriate content, all reviews require admin approval before display. Please refrain from insults or harassment.', ko: '⚠️ 부적절한 내용을 방지하기 위해 모든 댓글은 관리자 승인 후 표시됩니다. 욕설이나 모욕은 삼가해 주세요.' },
  'register.title': { 'zh-CN': '入驻档案', 'zh-TW': '入駐檔案', en: 'Create Profile', ko: '프로필 등록' },
  'register.desc': { 'zh-CN': '填写你的信息，创建你的评价档案', 'zh-TW': '填寫你的資訊，創建你的評價檔案', en: 'Fill in your info to create your profile', ko: '정보를 입력하여 프로필을 등록하세요' },
  'register.name': { 'zh-CN': '姓名 *', 'zh-TW': '姓名 *', en: 'Name *', ko: '이름 *' },
  'register.name_placeholder': { 'zh-CN': '输入姓名', 'zh-TW': '輸入姓名', en: 'Enter name', ko: '이름 입력' },
  'register.type': { 'zh-CN': '身份 *', 'zh-TW': '身份 *', en: 'Role *', ko: '신분 *' },
  'register.student': { 'zh-CN': '学生', 'zh-TW': '學生', en: 'Student', ko: '학생' },
  'register.teacher': { 'zh-CN': '教师', 'zh-TW': '教師', en: 'Teacher', ko: '교사' },
  'register.class': { 'zh-CN': '班级 *', 'zh-TW': '班級 *', en: 'Class *', ko: '반 *' },
  'register.class_placeholder': { 'zh-CN': '请选择班级', 'zh-TW': '請選擇班級', en: 'Select class', ko: '반 선택' },
  'register.bio': { 'zh-CN': '简介（选填）', 'zh-TW': '簡介（選填）', en: 'Bio (optional)', ko: '소개 (선택)' },
  'register.bio_placeholder': { 'zh-CN': '简单介绍自己...', 'zh-TW': '簡單介紹自己...', en: 'Introduce yourself...', ko: '자기소개...' },
  'register.photo': { 'zh-CN': '照片', 'zh-TW': '照片', en: 'Photo', ko: '사진' },
  'register.photo_upload': { 'zh-CN': '点击上传照片', 'zh-TW': '點擊上傳照片', en: 'Click to upload photo', ko: '사진 업로드' },
  'register.photo_hint': { 'zh-CN': 'JPEG/PNG/WebP, 不超过 5MB', 'zh-TW': 'JPEG/PNG/WebP, 不超過 5MB', en: 'JPEG/PNG/WebP, max 5MB', ko: 'JPEG/PNG/WebP, 최대 5MB' },
  'register.password': { 'zh-CN': '设置密码 *', 'zh-TW': '設定密碼 *', en: 'Set Password *', ko: '비밀번호 설정 *' },
  'register.password_placeholder': { 'zh-CN': '至少4位密码，用于日后编辑档案', 'zh-TW': '至少4位密碼，用於日後編輯檔案', en: 'At least 4 chars, for editing later', ko: '4자리 이상, 프로필 편집용' },
  'register.confirm_password': { 'zh-CN': '确认密码 *', 'zh-TW': '確認密碼 *', en: 'Confirm Password *', ko: '비밀번호 확인 *' },
  'register.confirm_placeholder': { 'zh-CN': '再次输入密码', 'zh-TW': '再次輸入密碼', en: 'Re-enter password', ko: '비밀번호 재입력' },
  'register.disclaimer_title': { 'zh-CN': '免责声明 *', 'zh-TW': '免責聲明 *', en: 'Disclaimer *', ko: '면책 조항 *' },
  'register.disclaimer_text': { 'zh-CN': '本人自愿上传个人信息至本网站，并已知悉本人将接受他人的公开评价。本人确认所填信息真实有效，并自行承担由此产生的一切后果。本人理解评价内容不代表本站立场。', 'zh-TW': '本人自願上傳個人資訊至本網站，並已知悉本人將接受他人的公開評價。本人確認所填資訊真實有效，並自行承擔由此產生的一切後果。本人理解評價內容不代表本站立場。', en: 'I voluntarily upload my personal information and acknowledge that I will receive public reviews. I confirm the information is accurate and assume all consequences.', ko: '본인은 자발적으로 개인정보를 업로드하며, 타인의 공개 평가를 받을 수 있음을 인지합니다. 제공된 정보가 정확함을 확인하며 모든 결과를 스스로 감수합니다.' },
  'register.submit': { 'zh-CN': '同意声明并入驻', 'zh-TW': '同意聲明並入駐', en: 'Agree & Join', ko: '동의하고 등록' },
  'register.submitting': { 'zh-CN': '提交中...', 'zh-TW': '提交中...', en: 'Submitting...', ko: '제출 중...' },
  'register.success': { 'zh-CN': '入驻成功！请记好你的密码，用于日后编辑档案。', 'zh-TW': '入駐成功！請記好你的密碼，用於日後編輯檔案。', en: 'Success! Remember your password for future edits.', ko: '등록 완료! 비밀번호를 기억해두세요.' },
  'register.error_name_pw': { 'zh-CN': '请填写姓名和密码', 'zh-TW': '請填寫姓名和密碼', en: 'Please fill in name and password', ko: '이름과 비밀번호를 입력하세요' },
  'register.error_pw_match': { 'zh-CN': '两次密码输入不一致', 'zh-TW': '兩次密碼輸入不一致', en: 'Passwords do not match', ko: '비밀번호가 일치하지 않습니다' },
  'register.error_class': { 'zh-CN': '请选择班级', 'zh-TW': '請選擇班級', en: 'Please select a class', ko: '반을 선택하세요' },
  'register.error_disclaimer': { 'zh-CN': '请同意免责声明', 'zh-TW': '請同意免責聲明', en: 'Please agree to the disclaimer', ko: '면책 조항에 동의하세요' },
  'edit.title': { 'zh-CN': '编辑档案', 'zh-TW': '編輯檔案', en: 'Edit Profile', ko: '프로필 편집' },
  'edit.desc': { 'zh-CN': '验证身份后即可编辑或删除自己的档案', 'zh-TW': '驗證身份後即可編輯或刪除自己的檔案', en: 'Verify your identity to edit or delete', ko: '본인 확인 후 편집/삭제 가능' },
  'edit.name': { 'zh-CN': '姓名', 'zh-TW': '姓名', en: 'Name', ko: '이름' },
  'edit.name_placeholder': { 'zh-CN': '入驻时填写的姓名', 'zh-TW': '入駐時填寫的姓名', en: 'Name used during registration', ko: '등록 시 입력한 이름' },
  'edit.password': { 'zh-CN': '密码', 'zh-TW': '密碼', en: 'Password', ko: '비밀번호' },
  'edit.password_placeholder': { 'zh-CN': '入驻时设置的密码', 'zh-TW': '入駐時設定的密碼', en: 'Password set during registration', ko: '등록 시 설정한 비밀번호' },
  'edit.verify_btn': { 'zh-CN': '验证身份', 'zh-TW': '驗證身份', en: 'Verify', ko: '본인 확인' },
  'edit.verifying': { 'zh-CN': '验证中...', 'zh-TW': '驗證中...', en: 'Verifying...', ko: '확인 중...' },
  'edit.identity': { 'zh-CN': '身份', 'zh-TW': '身份', en: 'Role', ko: '신분' },
  'edit.class': { 'zh-CN': '班级', 'zh-TW': '班級', en: 'Class', ko: '반' },
  'edit.new_password': { 'zh-CN': '新密码（留空不修改）', 'zh-TW': '新密碼（留空不修改）', en: 'New password (leave blank to keep)', ko: '새 비밀번호 (공란 시 유지)' },
  'edit.new_password_placeholder': { 'zh-CN': '输入新密码', 'zh-TW': '輸入新密碼', en: 'Enter new password', ko: '새 비밀번호 입력' },
  'edit.save': { 'zh-CN': '保存修改', 'zh-TW': '儲存修改', en: 'Save Changes', ko: '변경사항 저장' },
  'edit.saving': { 'zh-CN': '保存中...', 'zh-TW': '儲存中...', en: 'Saving...', ko: '저장 중...' },
  'edit.saved': { 'zh-CN': '档案已更新', 'zh-TW': '檔案已更新', en: 'Profile updated', ko: '프로필 업데이트 완료' },
  'edit.delete': { 'zh-CN': '删除我的档案', 'zh-TW': '刪除我的檔案', en: 'Delete My Profile', ko: '프로필 삭제' },
  'edit.delete_confirm': { 'zh-CN': '确定要删除你的档案吗？此操作不可撤销，将同时删除所有评价数据。', 'zh-TW': '確定要刪除你的檔案嗎？此操作不可撤銷，將同時刪除所有評價數據。', en: 'Are you sure? This cannot be undone. All reviews will be deleted.', ko: '정말 삭제하시겠습니까? 모든 평가 데이터가 함께 삭제됩니다.' },
  'edit.delete_btn': { 'zh-CN': '确认删除', 'zh-TW': '確認刪除', en: 'Confirm Delete', ko: '삭제 확인' },
  'edit.deleting': { 'zh-CN': '删除中...', 'zh-TW': '刪除中...', en: 'Deleting...', ko: '삭제 중...' },
  'edit.cancel': { 'zh-CN': '取消', 'zh-TW': '取消', en: 'Cancel', ko: '취소' },
  'edit.deleted_title': { 'zh-CN': '档案已删除', 'zh-TW': '檔案已刪除', en: 'Profile Deleted', ko: '프로필 삭제됨' },
  'edit.deleted_desc': { 'zh-CN': '你的档案及所有相关评价已从网站移除。', 'zh-TW': '你的檔案及所有相關評價已從網站移除。', en: 'Your profile and all reviews have been removed.', ko: '프로필과 모든 평가가 삭제되었습니다.' },
  'edit.back_home': { 'zh-CN': '返回首页', 'zh-TW': '返回首頁', en: 'Back to Home', ko: '홈으로' },
  'edit.photo_change': { 'zh-CN': '点击更换照片', 'zh-TW': '點擊更換照片', en: 'Click to change photo', ko: '사진 변경' },
  'suggest.title': { 'zh-CN': '提交建议', 'zh-TW': '提交建議', en: 'Submit Feedback', ko: '제안하기' },
  'suggest.desc': { 'zh-CN': '你的建议将帮助我们完善这个网站', 'zh-TW': '你的建議將幫助我們完善這個網站', en: 'Your feedback helps us improve', ko: '소중한 의견으로 사이트를 개선하겠습니다' },
  'suggest.content': { 'zh-CN': '建议内容 *', 'zh-TW': '建議內容 *', en: 'Feedback *', ko: '제안 내용 *' },
  'suggest.placeholder': { 'zh-CN': '你的建议、想法或遇到的bug...', 'zh-TW': '你的建議、想法或遇到的bug...', en: 'Your suggestions, ideas, or bugs...', ko: '제안, 아이디어, 버그 신고...' },
  'suggest.contact': { 'zh-CN': '联系方式（选填）', 'zh-TW': '聯繫方式（選填）', en: 'Contact (optional)', ko: '연락처 (선택)' },
  'suggest.contact_placeholder': { 'zh-CN': '邮箱或微信号，方便我们回复', 'zh-TW': '郵箱或微信號，方便我們回覆', en: 'Email or WeChat for follow-up', ko: '이메일 또는 연락처' },
  'suggest.submit': { 'zh-CN': '提交建议', 'zh-TW': '提交建議', en: 'Submit', ko: '제출' },
  'suggest.submitting': { 'zh-CN': '提交中...', 'zh-TW': '提交中...', en: 'Submitting...', ko: '제출 중...' },
  'suggest.success_title': { 'zh-CN': '感谢你的建议！', 'zh-TW': '感謝你的建議！', en: 'Thank you!', ko: '감사합니다!' },
  'suggest.success_desc': { 'zh-CN': '我们会认真阅读每一条反馈', 'zh-TW': '我們會認真閱讀每一條反饋', en: 'We read every piece of feedback', ko: '모든 의견을 꼼꼼히 검토하겠습니다' },
  'suggest.another': { 'zh-CN': '再写一条', 'zh-TW': '再寫一條', en: 'Write another', ko: '다시 작성' },
  'lang.switch': { 'zh-CN': '语言', 'zh-TW': '語言', en: 'Language', ko: '언어' },
  'lang.zh_CN': { 'zh-CN': '简体中文', 'zh-TW': '簡體中文', en: 'Simplified Chinese', ko: '중국어 간체' },
  'lang.zh_TW': { 'zh-CN': '繁體中文', 'zh-TW': '繁體中文', en: 'Traditional Chinese', ko: '중국어 번체' },
  'lang.en': { 'zh-CN': 'English', 'zh-TW': 'English', en: 'English', ko: 'English' },
  'lang.ko': { 'zh-CN': '한국어', 'zh-TW': '한국어', en: '한국어', ko: '한국어' },
};

const LANG_ORDER: Language[] = ['zh-TW', 'ko', 'zh-CN', 'en'];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('zh-TW');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && LANG_ORDER.includes(saved)) { setLangState(saved); return; }
    setLangState('zh-TW');
  }, []);

  const setLang = (l: Language) => { setLangState(l); localStorage.setItem(STORAGE_KEY, l); };

  const tr = (key: string): string => {
    const entry = dict[key];
    if (entry) return entry[lang] || entry['zh-TW'] || key;
    if (key === '综合') {
      const map: Record<Language, string> = { 'zh-CN': '综合', 'zh-TW': '綜合', en: 'Overall', ko: '종합' };
      return map[lang] || '综合';
    }
    return key;
  };

  return <LangContext.Provider value={{ lang, setLang, t: tr }}>{children}</LangContext.Provider>;
}

export { LANG_ORDER };
