import type { Lang } from '@/types';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

interface Translations {
    app: { name: string; tagline: string };
    nav: Record<string, string>;
    common: Record<string, string>;
    login: Record<string, string>;
    dashboard: Record<string, string>;
    survey: Record<string, string>;
    builder: Record<string, string>;
    results: Record<string, string>;
    admin: { roles: Record<string, string>; roleDesc: Record<string, string>;[k: string]: unknown };
}

const T: Record<Lang, Translations> = {
    en: {
        app: { name: 'SurveyBD', tagline: 'Professional Survey Management System' },
        nav: { dashboard: 'Dashboard', surveys: 'My Surveys', allSurveys: 'All Surveys', create: 'Create Survey', results: 'Results & Analytics', users: 'User Management', logout: 'Logout' },
        common: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', view: 'View', search: 'Search...', loading: 'Loading...', confirm: 'Confirm', yes: 'Yes', no: 'No', active: 'Active', inactive: 'Inactive', actions: 'Actions', status: 'Status', createdAt: 'Created', close: 'Close', copy: 'Copy', copied: 'Copied!', preview: 'Preview', publish: 'Publish', draft: 'Draft', published: 'Published', closed: 'Closed', back: 'Back', submit: 'Submit', required: 'Required', add: 'Add', share: 'Share', export: 'Export', all: 'All', saveSuccess: 'Saved successfully!', deleteSuccess: 'Deleted!', error: 'An error occurred.', noData: 'No data available.', confirmDelete: 'Delete this? This cannot be undone.' },
        login: { welcome: 'Welcome Back', subtitle: 'Sign in to your account', email: 'Email Address', password: 'Password', loginBtn: 'Sign In', demoAccounts: 'Demo Accounts', adminAcc: 'Admin', creatorAcc: 'Creator', userAcc: 'Respondent', invalidCred: 'Invalid email or password.' },
        dashboard: { title: 'Dashboard', welcome: 'Welcome back', totalSurveys: 'Total Surveys', totalResponses: 'Total Responses', activeSurveys: 'Active Surveys', totalUsers: 'Total Users', recentSurveys: 'Recent Surveys', createNew: 'Create New Survey', viewAll: 'View All', thisMonth: 'This Month', responseRate: 'Response Rate' },
        survey: { title: 'Survey Title', description: 'Description', questions: 'Questions', responses: 'Responses', shareLink: 'Share Link', copyLink: 'Copy Link', qrCode: 'QR Code', downloadQR: 'Download QR', noSurveys: 'No surveys yet', noSurveysDesc: 'Create your first survey to get started.', publishConfirm: 'Publish this survey?', closeConfirm: 'Close this survey?', deleteConfirm: 'Delete this survey and all responses?', thankYou: 'Thank You!', thankYouDesc: 'Your response has been submitted.', surveyClosed: 'This survey is closed.', surveyNotFound: 'Survey not found.', surveyNotPublished: 'Survey not published yet.', submitResponse: 'Submit Response', fillRequired: 'Please fill in all required fields.', settings: 'Survey Settings', allowMultiple: 'Allow Multiple Submissions', showProgress: 'Show Progress Bar', anonymous: 'Anonymous Responses' },
        builder: { title: 'Survey Builder', questionTypes: 'Question Types', questionSettings: 'Question Settings', questionTitle: 'Question', multipleChoice: 'Multiple Choice', checkboxes: 'Checkboxes', shortText: 'Short Answer', longText: 'Long Answer', rating: 'Rating (Stars)', scale: 'Linear Scale', dropdown: 'Dropdown', date: 'Date / Time', yesNo: 'Yes / No', options: 'Options', addOption: 'Add Option', minLabel: 'Min Label', maxLabel: 'Max Label', minValue: 'Min Value', maxValue: 'Max Value', isRequired: 'Required question', clickToEdit: 'Click a question to edit', noQuestions: 'No questions yet', noQuestionsDesc: 'Click a question type on the left to add it.', saveSuccess: 'Survey saved!', publishSuccess: 'Survey published!', untitled: 'Untitled Survey', previewMode: 'Preview Mode', editMode: 'Edit Mode' },
        results: { title: 'Results & Analytics', selectSurvey: 'Select a survey to view results', totalResponses: 'Total Responses', completionRate: 'Completion Rate', avgTime: 'Avg. Time', lastResponse: 'Last Response', responses: 'Responses', summary: 'Summary', charts: 'Charts', noResponses: 'No responses yet', noResponsesDesc: 'Share your survey to start collecting responses.', exportCSV: 'Export CSV', respondent: 'Respondent', submittedAt: 'Submitted At', anonymous: 'Anonymous' },
        admin: { title: 'User Management', addUser: 'Add User', editUser: 'Edit User', name: 'Full Name', email: 'Email', role: 'Role', password: 'Password', confirmPw: 'Confirm Password', noUsers: 'No users found', pwMismatch: 'Passwords do not match', emailExists: 'Email already exists', userAdded: 'User added!', userUpdated: 'User updated!', userDeleted: 'User deleted!', roles: { admin: 'Super Admin', creator: 'Creator', respondent: 'Respondent' }, roleDesc: { admin: 'Full system access', creator: 'Create & manage surveys', respondent: 'Fill out surveys' } },
    },
    th: {
        app: { name: 'SurveyBD', tagline: 'ระบบจัดการแบบสอบถามมืออาชีพ' },
        nav: { dashboard: 'แดชบอร์ด', surveys: 'แบบสอบถามของฉัน', allSurveys: 'แบบสอบถามทั้งหมด', create: 'สร้างแบบสอบถาม', results: 'ผลลัพธ์และการวิเคราะห์', users: 'จัดการผู้ใช้', logout: 'ออกจากระบบ' },
        common: { save: 'บันทึก', cancel: 'ยกเลิก', delete: 'ลบ', edit: 'แก้ไข', view: 'ดู', search: 'ค้นหา...', loading: 'กำลังโหลด...', confirm: 'ยืนยัน', yes: 'ใช่', no: 'ไม่', active: 'ใช้งาน', inactive: 'ไม่ใช้งาน', actions: 'การดำเนินการ', status: 'สถานะ', createdAt: 'วันที่สร้าง', close: 'ปิด', copy: 'คัดลอก', copied: 'คัดลอกแล้ว!', preview: 'ดูตัวอย่าง', publish: 'เผยแพร่', draft: 'ร่าง', published: 'เผยแพร่แล้ว', closed: 'ปิดแล้ว', back: 'กลับ', submit: 'ส่ง', required: 'จำเป็น', add: 'เพิ่ม', share: 'แชร์', export: 'ส่งออก', all: 'ทั้งหมด', saveSuccess: 'บันทึกสำเร็จ!', deleteSuccess: 'ลบสำเร็จ!', error: 'เกิดข้อผิดพลาด', noData: 'ไม่มีข้อมูล', confirmDelete: 'ต้องการลบข้อมูลนี้ใช่ไหม?' },
        login: { welcome: 'ยินดีต้อนรับกลับ', subtitle: 'เข้าสู่ระบบบัญชีของคุณ', email: 'อีเมล', password: 'รหัสผ่าน', loginBtn: 'เข้าสู่ระบบ', demoAccounts: 'บัญชีสาธิต', adminAcc: 'ผู้ดูแลระบบ', creatorAcc: 'ผู้สร้าง', userAcc: 'ผู้ตอบ', invalidCred: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        dashboard: { title: 'แดชบอร์ด', welcome: 'ยินดีต้อนรับ', totalSurveys: 'แบบสอบถามทั้งหมด', totalResponses: 'คำตอบทั้งหมด', activeSurveys: 'แบบสอบถามที่ใช้งาน', totalUsers: 'ผู้ใช้ทั้งหมด', recentSurveys: 'แบบสอบถามล่าสุด', createNew: 'สร้างแบบสอบถามใหม่', viewAll: 'ดูทั้งหมด', thisMonth: 'เดือนนี้', responseRate: 'อัตราการตอบกลับ' },
        survey: { title: 'ชื่อแบบสอบถาม', description: 'คำอธิบาย', questions: 'คำถาม', responses: 'คำตอบ', shareLink: 'ลิงก์แชร์', copyLink: 'คัดลอกลิงก์', qrCode: 'QR Code', downloadQR: 'ดาวน์โหลด QR', noSurveys: 'ยังไม่มีแบบสอบถาม', noSurveysDesc: 'สร้างแบบสอบถามแรกของคุณเพื่อเริ่มต้น', publishConfirm: 'เผยแพร่แบบสอบถามนี้?', closeConfirm: 'ปิดแบบสอบถามนี้?', deleteConfirm: 'ลบแบบสอบถามและคำตอบทั้งหมด?', thankYou: 'ขอบคุณ!', thankYouDesc: 'คำตอบของคุณถูกบันทึกเรียบร้อยแล้ว', surveyClosed: 'แบบสอบถามนี้ปิดแล้ว', surveyNotFound: 'ไม่พบแบบสอบถาม', surveyNotPublished: 'แบบสอบถามนี้ยังไม่ได้เผยแพร่', submitResponse: 'ส่งคำตอบ', fillRequired: 'กรุณากรอกข้อมูลในช่องที่จำเป็น', settings: 'ตั้งค่าแบบสอบถาม', allowMultiple: 'อนุญาตให้ตอบหลายครั้ง', showProgress: 'แสดงแถบความคืบหน้า', anonymous: 'การตอบแบบไม่ระบุตัวตน' },
        builder: { title: 'สร้างแบบสอบถาม', questionTypes: 'ประเภทคำถาม', questionSettings: 'ตั้งค่าคำถาม', questionTitle: 'คำถาม', multipleChoice: 'ตัวเลือกเดียว', checkboxes: 'หลายตัวเลือก', shortText: 'คำตอบสั้น', longText: 'คำตอบยาว', rating: 'คะแนน (ดาว)', scale: 'สเกลเชิงเส้น', dropdown: 'รายการดรอปดาวน์', date: 'วันที่ / เวลา', yesNo: 'ใช่ / ไม่', options: 'ตัวเลือก', addOption: 'เพิ่มตัวเลือก', minLabel: 'ป้ายกำกับต่ำสุด', maxLabel: 'ป้ายกำกับสูงสุด', minValue: 'ค่าต่ำสุด', maxValue: 'ค่าสูงสุด', isRequired: 'คำถามบังคับ', clickToEdit: 'คลิกคำถามเพื่อแก้ไข', noQuestions: 'ยังไม่มีคำถาม', noQuestionsDesc: 'คลิกประเภทคำถามทางซ้ายเพื่อเพิ่ม', saveSuccess: 'บันทึกแบบสอบถามแล้ว!', publishSuccess: 'เผยแพร่แบบสอบถามแล้ว!', untitled: 'แบบสอบถามไม่มีชื่อ', previewMode: 'โหมดดูตัวอย่าง', editMode: 'โหมดแก้ไข' },
        results: { title: 'ผลลัพธ์และการวิเคราะห์', selectSurvey: 'เลือกแบบสอบถามเพื่อดูผลลัพธ์', totalResponses: 'คำตอบทั้งหมด', completionRate: 'อัตราการตอบสมบูรณ์', avgTime: 'เวลาเฉลี่ย', lastResponse: 'คำตอบล่าสุด', responses: 'คำตอบแต่ละราย', summary: 'สรุป', charts: 'แผนภูมิ', noResponses: 'ยังไม่มีคำตอบ', noResponsesDesc: 'แชร์แบบสอบถามเพื่อเริ่มเก็บข้อมูล', exportCSV: 'ส่งออก CSV', respondent: 'ผู้ตอบ', submittedAt: 'วันที่ส่ง', anonymous: 'ไม่ระบุตัวตน' },
        admin: { title: 'จัดการผู้ใช้', addUser: 'เพิ่มผู้ใช้', editUser: 'แก้ไขผู้ใช้', name: 'ชื่อ-นามสกุล', email: 'อีเมล', role: 'บทบาท', password: 'รหัสผ่าน', confirmPw: 'ยืนยันรหัสผ่าน', noUsers: 'ไม่พบผู้ใช้', pwMismatch: 'รหัสผ่านไม่ตรงกัน', emailExists: 'อีเมลนี้ถูกใช้แล้ว', userAdded: 'เพิ่มผู้ใช้สำเร็จ!', userUpdated: 'อัปเดตผู้ใช้แล้ว!', userDeleted: 'ลบผู้ใช้แล้ว!', roles: { admin: 'ผู้ดูแลระบบ', creator: 'ผู้สร้าง', respondent: 'ผู้ตอบ' }, roleDesc: { admin: 'เข้าถึงระบบทั้งหมด', creator: 'สร้างและจัดการแบบสอบถาม', respondent: 'กรอกแบบสอบถาม' } },
    },
};

export const getLang = (): Lang => {
    if (typeof window === 'undefined') return 'en';
    return (localStorage.getItem('survey_lang') as Lang) ?? 'en';
};

export const setLang = (lang: Lang): void => {
    if (typeof window !== 'undefined') localStorage.setItem('survey_lang', lang);
};

export const t = (lang: Lang, path: string): string => {
    const keys = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = T[lang];
    for (const k of keys) { val = val?.[k]; }
    return typeof val === 'string' ? val : path;
};
