const TRANSLATIONS = {
  en: {
    app: { name: 'SurveyBD', tagline: 'Professional Survey Management System' },
    nav: {
      dashboard: 'Dashboard', surveys: 'My Surveys', create: 'Create Survey',
      results: 'Results & Analytics', users: 'User Management',
      settings: 'Settings', logout: 'Logout', allSurveys: 'All Surveys'
    },
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      view: 'View', search: 'Search...', loading: 'Loading...', confirm: 'Confirm',
      yes: 'Yes', no: 'No', active: 'Active', inactive: 'Inactive',
      actions: 'Actions', status: 'Status', createdAt: 'Created', close: 'Close',
      copy: 'Copy', copied: 'Copied!', preview: 'Preview', publish: 'Publish',
      draft: 'Draft', published: 'Published', closed: 'Closed', back: 'Back',
      next: 'Next', submit: 'Submit', required: 'Required', optional: 'Optional',
      add: 'Add', remove: 'Remove', duplicate: 'Duplicate', share: 'Share',
      export: 'Export', filter: 'Filter', all: 'All', none: 'None',
      saveSuccess: 'Saved successfully!', deleteSuccess: 'Deleted successfully!',
      error: 'An error occurred. Please try again.', noData: 'No data available.',
      confirmDelete: 'Are you sure you want to delete this? This action cannot be undone.'
    },
    login: {
      welcome: 'Welcome Back', subtitle: 'Sign in to your account',
      email: 'Email Address', password: 'Password',
      loginBtn: 'Sign In', forgotPw: 'Forgot Password?',
      demoAccounts: 'Demo Accounts', adminAcc: '🔑 Admin', creatorAcc: '✏️ Creator',
      userAcc: '👤 Respondent', clickToFill: 'Click to fill credentials',
      invalidCred: 'Invalid email or password.', loginSuccess: 'Welcome back!'
    },
    dashboard: {
      title: 'Dashboard', welcome: 'Welcome back',
      totalSurveys: 'Total Surveys', totalResponses: 'Total Responses',
      activeSurveys: 'Active Surveys', totalUsers: 'Total Users',
      recentSurveys: 'Recent Surveys', createFirst: 'Create your first survey',
      createFirstDesc: 'Start collecting responses by creating your first survey.',
      createNew: 'Create New Survey', viewAll: 'View All',
      quickStats: 'Quick Stats', thisMonth: 'This Month', responseRate: 'Response Rate'
    },
    survey: {
      title: 'Survey Title', titleTh: 'Survey Title (Thai)', description: 'Description',
      descTh: 'Description (Thai)', questions: 'Questions', responses: 'Responses',
      created: 'Created', status: 'Status', creator: 'Creator',
      settings: 'Survey Settings', allowMultiple: 'Allow Multiple Submissions',
      showProgress: 'Show Progress Bar', anonymous: 'Anonymous Responses',
      startDate: 'Start Date', endDate: 'End Date', shareLink: 'Share Link',
      copyLink: 'Copy Link', qrCode: 'QR Code', downloadQR: 'Download QR',
      noSurveys: 'No surveys yet', noSurveysDesc: 'Create your first survey to get started.',
      publishConfirm: 'Publish this survey? Respondents will be able to access it.',
      closeConfirm: 'Close this survey? No new responses will be accepted.',
      deleteConfirm: 'Delete this survey and all its responses?',
      thankYou: 'Thank You!', thankYouDesc: 'Your response has been submitted successfully.',
      alreadySubmitted: 'You have already submitted this survey.',
      surveyNotFound: 'Survey not found.', surveyClosed: 'This survey is now closed.',
      surveyNotPublished: 'This survey is not yet published.',
      submitResponse: 'Submit Response', fillRequired: 'Please fill in all required fields.'
    },
    builder: {
      title: 'Survey Builder', addQuestion: 'Add Question',
      questionTypes: 'Question Types', questionSettings: 'Question Settings',
      questionTitle: 'Question', questionTitleTh: 'Question (Thai)',
      multipleChoice: 'Multiple Choice', checkboxes: 'Checkboxes',
      shortText: 'Short Answer', longText: 'Long Answer (Paragraph)',
      rating: 'Rating (Stars)', scale: 'Linear Scale', dropdown: 'Dropdown',
      date: 'Date / Time', yesNo: 'Yes / No',
      options: 'Options', addOption: 'Add Option', minLabel: 'Min Label',
      maxLabel: 'Max Label', minValue: 'Min Value', maxValue: 'Max Value',
      isRequired: 'Required question', clickToEdit: 'Click a question to edit',
      dragToReorder: 'Drag to reorder', noQuestions: 'No questions yet',
      noQuestionsDesc: 'Click a question type on the left to add it.',
      saveSuccess: 'Survey saved!', publishSuccess: 'Survey published!',
      untitled: 'Untitled Survey', previewMode: 'Preview Mode', editMode: 'Edit Mode'
    },
    results: {
      title: 'Results & Analytics', selectSurvey: 'Select a survey to view results',
      totalResponses: 'Total Responses', completionRate: 'Completion Rate',
      avgTime: 'Avg. Completion Time', lastResponse: 'Last Response',
      responses: 'Individual Responses', summary: 'Summary', charts: 'Charts',
      noResponses: 'No responses yet', noResponsesDesc: 'Share your survey to start collecting responses.',
      exportCSV: 'Export CSV', respondent: 'Respondent', submittedAt: 'Submitted At',
      anonymous: 'Anonymous', minutes: 'min', seconds: 'sec'
    },
    admin: {
      title: 'User Management', addUser: 'Add User', editUser: 'Edit User',
      name: 'Full Name', email: 'Email', role: 'Role', password: 'Password',
      confirmPw: 'Confirm Password', roles: { admin: 'Super Admin', creator: 'Creator', respondent: 'Respondent' },
      roleDesc: { admin: 'Full system access', creator: 'Create & manage surveys', respondent: 'Fill out surveys' },
      noUsers: 'No users found', pwMismatch: 'Passwords do not match',
      emailExists: 'Email already exists', userAdded: 'User added successfully!',
      userUpdated: 'User updated!', userDeleted: 'User deleted!'
    }
  },
  th: {
    app: { name: 'SurveyBD', tagline: 'ระบบจัดการแบบสอบถามมืออาชีพ' },
    nav: {
      dashboard: 'แดชบอร์ด', surveys: 'แบบสอบถามของฉัน', create: 'สร้างแบบสอบถาม',
      results: 'ผลลัพธ์และการวิเคราะห์', users: 'จัดการผู้ใช้',
      settings: 'ตั้งค่า', logout: 'ออกจากระบบ', allSurveys: 'แบบสอบถามทั้งหมด'
    },
    common: {
      save: 'บันทึก', cancel: 'ยกเลิก', delete: 'ลบ', edit: 'แก้ไข',
      view: 'ดู', search: 'ค้นหา...', loading: 'กำลังโหลด...', confirm: 'ยืนยัน',
      yes: 'ใช่', no: 'ไม่', active: 'ใช้งาน', inactive: 'ไม่ใช้งาน',
      actions: 'การดำเนินการ', status: 'สถานะ', createdAt: 'วันที่สร้าง', close: 'ปิด',
      copy: 'คัดลอก', copied: 'คัดลอกแล้ว!', preview: 'ดูตัวอย่าง', publish: 'เผยแพร่',
      draft: 'ร่าง', published: 'เผยแพร่แล้ว', closed: 'ปิดแล้ว', back: 'กลับ',
      next: 'ถัดไป', submit: 'ส่ง', required: 'จำเป็น', optional: 'ไม่จำเป็น',
      add: 'เพิ่ม', remove: 'ลบออก', duplicate: 'ทำสำเนา', share: 'แชร์',
      export: 'ส่งออก', filter: 'กรอง', all: 'ทั้งหมด', none: 'ไม่มี',
      saveSuccess: 'บันทึกสำเร็จ!', deleteSuccess: 'ลบสำเร็จ!',
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่', noData: 'ไม่มีข้อมูล',
      confirmDelete: 'ต้องการลบข้อมูลนี้ใช่ไหม? ไม่สามารถกู้คืนได้'
    },
    login: {
      welcome: 'ยินดีต้อนรับกลับ', subtitle: 'เข้าสู่ระบบบัญชีของคุณ',
      email: 'อีเมล', password: 'รหัสผ่าน',
      loginBtn: 'เข้าสู่ระบบ', forgotPw: 'ลืมรหัสผ่าน?',
      demoAccounts: 'บัญชีสาธิต', adminAcc: '🔑 ผู้ดูแลระบบ', creatorAcc: '✏️ ผู้สร้าง',
      userAcc: '👤 ผู้ตอบแบบสอบถาม', clickToFill: 'คลิกเพื่อกรอกข้อมูล',
      invalidCred: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', loginSuccess: 'ยินดีต้อนรับ!'
    },
    dashboard: {
      title: 'แดชบอร์ด', welcome: 'ยินดีต้อนรับ',
      totalSurveys: 'แบบสอบถามทั้งหมด', totalResponses: 'คำตอบทั้งหมด',
      activeSurveys: 'แบบสอบถามที่ใช้งาน', totalUsers: 'ผู้ใช้ทั้งหมด',
      recentSurveys: 'แบบสอบถามล่าสุด', createFirst: 'สร้างแบบสอบถามแรกของคุณ',
      createFirstDesc: 'เริ่มเก็บข้อมูลโดยการสร้างแบบสอบถามแรก',
      createNew: 'สร้างแบบสอบถามใหม่', viewAll: 'ดูทั้งหมด',
      quickStats: 'สถิติด่วน', thisMonth: 'เดือนนี้', responseRate: 'อัตราการตอบกลับ'
    },
    survey: {
      title: 'ชื่อแบบสอบถาม', titleTh: 'ชื่อแบบสอบถาม (ภาษาไทย)', description: 'คำอธิบาย',
      descTh: 'คำอธิบาย (ภาษาไทย)', questions: 'คำถาม', responses: 'คำตอบ',
      created: 'วันที่สร้าง', status: 'สถานะ', creator: 'ผู้สร้าง',
      settings: 'ตั้งค่าแบบสอบถาม', allowMultiple: 'อนุญาตให้ตอบหลายครั้ง',
      showProgress: 'แสดงแถบความคืบหน้า', anonymous: 'การตอบแบบไม่ระบุตัวตน',
      startDate: 'วันที่เริ่มต้น', endDate: 'วันที่สิ้นสุด', shareLink: 'ลิงก์แชร์',
      copyLink: 'คัดลอกลิงก์', qrCode: 'QR Code', downloadQR: 'ดาวน์โหลด QR',
      noSurveys: 'ยังไม่มีแบบสอบถาม', noSurveysDesc: 'สร้างแบบสอบถามแรกของคุณเพื่อเริ่มต้น',
      publishConfirm: 'เผยแพร่แบบสอบถามนี้? ผู้ตอบจะสามารถเข้าถึงได้',
      closeConfirm: 'ปิดแบบสอบถามนี้? จะไม่รับคำตอบใหม่',
      deleteConfirm: 'ลบแบบสอบถามและคำตอบทั้งหมดของแบบสอบถามนี้?',
      thankYou: 'ขอบคุณ!', thankYouDesc: 'คำตอบของคุณถูกบันทึกเรียบร้อยแล้ว',
      alreadySubmitted: 'คุณได้ส่งแบบสอบถามนี้แล้ว',
      surveyNotFound: 'ไม่พบแบบสอบถาม', surveyClosed: 'แบบสอบถามนี้ปิดแล้ว',
      surveyNotPublished: 'แบบสอบถามนี้ยังไม่ได้เผยแพร่',
      submitResponse: 'ส่งคำตอบ', fillRequired: 'กรุณากรอกข้อมูลในช่องที่จำเป็น'
    },
    builder: {
      title: 'สร้างแบบสอบถาม', addQuestion: 'เพิ่มคำถาม',
      questionTypes: 'ประเภทคำถาม', questionSettings: 'ตั้งค่าคำถาม',
      questionTitle: 'คำถาม', questionTitleTh: 'คำถาม (ภาษาไทย)',
      multipleChoice: 'ตัวเลือกเดียว', checkboxes: 'หลายตัวเลือก',
      shortText: 'คำตอบสั้น', longText: 'คำตอบยาว (ย่อหน้า)',
      rating: 'คะแนน (ดาว)', scale: 'สเกลเชิงเส้น', dropdown: 'รายการดรอปดาวน์',
      date: 'วันที่ / เวลา', yesNo: 'ใช่ / ไม่',
      options: 'ตัวเลือก', addOption: 'เพิ่มตัวเลือก', minLabel: 'ป้ายกำกับต่ำสุด',
      maxLabel: 'ป้ายกำกับสูงสุด', minValue: 'ค่าต่ำสุด', maxValue: 'ค่าสูงสุด',
      isRequired: 'คำถามบังคับ', clickToEdit: 'คลิกคำถามเพื่อแก้ไข',
      dragToReorder: 'ลากเพื่อจัดเรียงใหม่', noQuestions: 'ยังไม่มีคำถาม',
      noQuestionsDesc: 'คลิกประเภทคำถามทางซ้ายเพื่อเพิ่ม',
      saveSuccess: 'บันทึกแบบสอบถามแล้ว!', publishSuccess: 'เผยแพร่แบบสอบถามแล้ว!',
      untitled: 'แบบสอบถามไม่มีชื่อ', previewMode: 'โหมดดูตัวอย่าง', editMode: 'โหมดแก้ไข'
    },
    results: {
      title: 'ผลลัพธ์และการวิเคราะห์', selectSurvey: 'เลือกแบบสอบถามเพื่อดูผลลัพธ์',
      totalResponses: 'คำตอบทั้งหมด', completionRate: 'อัตราการตอบสมบูรณ์',
      avgTime: 'เวลาเฉลี่ย', lastResponse: 'คำตอบล่าสุด',
      responses: 'คำตอบแต่ละราย', summary: 'สรุป', charts: 'แผนภูมิ',
      noResponses: 'ยังไม่มีคำตอบ', noResponsesDesc: 'แชร์แบบสอบถามเพื่อเริ่มเก็บข้อมูล',
      exportCSV: 'ส่งออก CSV', respondent: 'ผู้ตอบ', submittedAt: 'วันที่ส่ง',
      anonymous: 'ไม่ระบุตัวตน', minutes: 'นาที', seconds: 'วินาที'
    },
    admin: {
      title: 'จัดการผู้ใช้', addUser: 'เพิ่มผู้ใช้', editUser: 'แก้ไขผู้ใช้',
      name: 'ชื่อ-นามสกุล', email: 'อีเมล', role: 'บทบาท', password: 'รหัสผ่าน',
      confirmPw: 'ยืนยันรหัสผ่าน', roles: { admin: 'ผู้ดูแลระบบ', creator: 'ผู้สร้าง', respondent: 'ผู้ตอบ' },
      roleDesc: { admin: 'เข้าถึงระบบทั้งหมด', creator: 'สร้างและจัดการแบบสอบถาม', respondent: 'กรอกแบบสอบถาม' },
      noUsers: 'ไม่พบผู้ใช้', pwMismatch: 'รหัสผ่านไม่ตรงกัน',
      emailExists: 'อีเมลนี้ถูกใช้แล้ว', userAdded: 'เพิ่มผู้ใช้สำเร็จ!',
      userUpdated: 'อัปเดตผู้ใช้แล้ว!', userDeleted: 'ลบผู้ใช้แล้ว!'
    }
  }
};

const I18n = {
  lang: localStorage.getItem('survey_lang') || 'en',
  t(path) {
    const keys = path.split('.');
    let val = TRANSLATIONS[this.lang];
    for (const k of keys) { val = val?.[k]; }
    return val || path;
  },
  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('survey_lang', lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    if (typeof onLangChange === 'function') onLangChange(lang);
  },
  init() {
    document.documentElement.lang = this.lang;
    this.setLang(this.lang);
  }
};
