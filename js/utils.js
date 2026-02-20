// ── DATA LAYER ──────────────────────────────────────────────────
const DB = {
    KEYS: { users: 'sv_users', surveys: 'sv_surveys', responses: 'sv_responses', session: 'sv_session' },

    get(key) { try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; } },
    set(key, data) { localStorage.setItem(key, JSON.stringify(data)); },

    getUsers() { return this.get(this.KEYS.users) || []; },
    saveUsers(u) { this.set(this.KEYS.users, u); },
    getUserById(id) { return this.getUsers().find(u => u.id === id) || null; },

    getSurveys() { return this.get(this.KEYS.surveys) || []; },
    saveSurveys(s) { this.set(this.KEYS.surveys, s); },
    getSurveyById(id) { return this.getSurveys().find(s => s.id === id) || null; },
    saveSurvey(survey) {
        const list = this.getSurveys();
        const idx = list.findIndex(s => s.id === survey.id);
        if (idx >= 0) list[idx] = survey; else list.push(survey);
        this.saveSurveys(list);
    },
    deleteSurvey(id) {
        this.saveSurveys(this.getSurveys().filter(s => s.id !== id));
        this.saveResponses(this.getResponses().filter(r => r.surveyId !== id));
    },

    getResponses() { return this.get(this.KEYS.responses) || []; },
    saveResponses(r) { this.set(this.KEYS.responses, r); },
    getResponsesBySurvey(surveyId) { return this.getResponses().filter(r => r.surveyId === surveyId); },
    saveResponse(resp) {
        const list = this.getResponses();
        list.push(resp);
        this.saveResponses(list);
    },
    hasResponded(surveyId, userId) {
        if (!userId) return false;
        return this.getResponses().some(r => r.surveyId === surveyId && r.respondentId === userId);
    },

    getSession() { return this.get(this.KEYS.session); },
    setSession(user) { this.set(this.KEYS.session, { id: user.id, name: user.name, email: user.email, role: user.role }); },
    clearSession() { localStorage.removeItem(this.KEYS.session); },

    init() {
        if (this.getUsers().length) return; // already initialized
        const users = [
            { id: 'u1', name: 'Super Admin', email: 'admin@survey.com', password: 'admin123', role: 'admin', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
            { id: 'u2', name: 'Kanokkwan Sangsan', email: 'creator@survey.com', password: 'creator123', role: 'creator', isActive: true, createdAt: '2026-01-15T00:00:00Z' },
            { id: 'u3', name: 'Somchai Jaidee', email: 'user@survey.com', password: 'user123', role: 'respondent', isActive: true, createdAt: '2026-02-01T00:00:00Z' }
        ];
        this.saveUsers(users);

        const surveys = [
            {
                id: 's1', title: 'Customer Satisfaction Survey', titleTh: 'แบบสอบถามความพึงพอใจลูกค้า',
                description: 'Help us improve our services by sharing your experience.',
                descriptionTh: 'ช่วยเราปรับปรุงบริการโดยแบ่งปันประสบการณ์ของคุณ',
                creatorId: 'u2', status: 'published',
                questions: [
                    { id: 'q1', type: 'rating', title: 'How satisfied are you with our service?', titleTh: 'คุณพึงพอใจบริการของเราเพียงใด?', required: true },
                    { id: 'q2', type: 'multiple_choice', title: 'How did you hear about us?', titleTh: 'คุณรู้จักเราได้อย่างไร?', required: true, options: ['Social Media', 'Friend Referral', 'Search Engine', 'Advertisement', 'Other'], optionsTh: ['โซเชียลมีเดีย', 'เพื่อนแนะนำ', 'เครื่องมือค้นหา', 'โฆษณา', 'อื่นๆ'] },
                    { id: 'q3', type: 'long_text', title: 'What improvements would you suggest?', titleTh: 'คุณมีข้อเสนอแนะในการปรับปรุงอย่างไรบ้าง?', required: false },
                    { id: 'q4', type: 'yes_no', title: 'Would you recommend us to others?', titleTh: 'คุณจะแนะนำเราให้คนอื่นหรือไม่?', required: true }
                ],
                settings: { allowMultiple: false, showProgress: true, anonymous: false },
                createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z', publishedAt: '2026-02-01T09:00:00Z'
            },
            {
                id: 's2', title: 'Employee Engagement Survey', titleTh: 'แบบสอบถามความผูกพันพนักงาน',
                description: 'Annual employee engagement and satisfaction survey.',
                descriptionTh: 'แบบสอบถามความผูกพันและความพึงพอใจพนักงานประจำปี',
                creatorId: 'u2', status: 'draft',
                questions: [
                    { id: 'q5', type: 'scale', title: 'Rate your overall job satisfaction (1-10)', titleTh: 'ให้คะแนนความพึงพอใจในงานโดยรวม (1-10)', required: true, minValue: 1, maxValue: 10, minLabel: 'Very Dissatisfied', maxLabel: 'Very Satisfied' },
                    { id: 'q6', type: 'checkboxes', title: 'Which benefits do you value most?', titleTh: 'สวัสดิการใดที่คุณให้คุณค่ามากที่สุด?', required: false, options: ['Health Insurance', 'Remote Work', 'Training', 'Salary', 'Annual Leave', 'Team Activities'], optionsTh: ['ประกันสุขภาพ', 'ทำงานจากบ้าน', 'การฝึกอบรม', 'เงินเดือน', 'วันลาประจำปี', 'กิจกรรมทีม'] },
                    { id: 'q7', type: 'short_text', title: 'What do you enjoy most about your role?', titleTh: 'คุณชอบอะไรมากที่สุดในบทบาทของคุณ?', required: false }
                ],
                settings: { allowMultiple: false, showProgress: true, anonymous: true },
                createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z', publishedAt: null
            }
        ];
        this.saveSurveys(surveys);

        const now = new Date();
        const responses = [];
        const names = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Emma Davis'];
        for (let i = 0; i < 8; i++) {
            const d = new Date(now); d.setDate(d.getDate() - Math.floor(Math.random() * 14));
            responses.push({
                id: 'r' + (i + 1), surveyId: 's1',
                respondentId: null, respondentName: names[i % names.length],
                answers: {
                    q1: Math.floor(Math.random() * 3) + 3,
                    q2: ['Social Media', 'Friend Referral', 'Search Engine', 'Advertisement', 'Other'][Math.floor(Math.random() * 5)],
                    q3: ['Great service!', 'Could be faster', 'Very helpful team', 'Excellent experience', 'Good but room to improve'][i % 5],
                    q4: Math.random() > 0.2 ? 'yes' : 'no'
                },
                submittedAt: d.toISOString(), completionTime: Math.floor(Math.random() * 180) + 60
            });
        }
        this.saveResponses(responses);
    }
};

// ── AUTH ─────────────────────────────────────────────────────────
const Auth = {
    login(email, password) {
        const users = DB.getUsers();
        const user = users.find(u => u.email === email && u.password === password && u.isActive);
        if (user) { DB.setSession(user); return { success: true, user }; }
        return { success: false };
    },
    logout() { DB.clearSession(); window.location.href = 'index.html'; },
    getUser() { return DB.getSession(); },
    guard(requiredRole) {
        const user = DB.getSession();
        if (!user) { window.location.href = 'index.html'; return null; }
        if (requiredRole) {
            const hierarchy = { admin: 3, creator: 2, respondent: 1 };
            if (hierarchy[user.role] < hierarchy[requiredRole]) {
                window.location.href = 'dashboard.html'; return null;
            }
        }
        return user;
    },
    can(user, action) {
        const perms = {
            admin: ['manage_users', 'create_survey', 'view_all_surveys', 'view_all_responses', 'publish_survey', 'delete_survey'],
            creator: ['create_survey', 'view_own_surveys', 'view_own_responses', 'publish_survey'],
            respondent: ['fill_survey']
        };
        return (perms[user?.role] || []).includes(action);
    }
};

// ── UTILS ────────────────────────────────────────────────────────
const Utils = {
    uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    formatDate(iso, lang = 'en') {
        if (!iso) return '—';
        const d = new Date(iso);
        if (lang === 'th') return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },
    formatTime(seconds) {
        if (!seconds) return '—';
        const m = Math.floor(seconds / 60), s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    },
    timeAgo(iso) {
        const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
        if (sec < 60) return 'just now';
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
        return `${Math.floor(sec / 86400)}d ago`;
    },
    copyText(text) {
        navigator.clipboard.writeText(text).catch(() => {
            const el = document.createElement('textarea');
            el.value = text; document.body.appendChild(el);
            el.select(); document.execCommand('copy'); document.body.removeChild(el);
        });
    },
    escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
    truncate(str, n = 60) { return str && str.length > n ? str.slice(0, n) + '…' : str; },
    getSurveyStatusBadge(status, lang = 'en') {
        const map = { published: 'badge-success', draft: 'badge-muted', closed: 'badge-danger' };
        const labels = { en: { published: 'Published', draft: 'Draft', closed: 'Closed' }, th: { published: 'เผยแพร่แล้ว', draft: 'ร่าง', closed: 'ปิดแล้ว' } };
        return `<span class="badge ${map[status] || 'badge-muted'}">${labels[lang]?.[status] || status}</span>`;
    },
    getRoleBadge(role, lang = 'en') {
        const map = { admin: 'badge-danger', creator: 'badge-primary', respondent: 'badge-muted' };
        const labels = { en: { admin: 'Admin', creator: 'Creator', respondent: 'Respondent' }, th: { admin: 'ผู้ดูแลระบบ', creator: 'ผู้สร้าง', respondent: 'ผู้ตอบ' } };
        return `<span class="badge ${map[role] || 'badge-muted'}">${labels[lang]?.[role] || role}</span>`;
    },
    getQuestionTypeInfo(type, lang = 'en') {
        const info = {
            multiple_choice: { icon: '🔘', color: '#6366f1', en: 'Multiple Choice', th: 'ตัวเลือกเดียว' },
            checkboxes: { icon: '☑️', color: '#8b5cf6', en: 'Checkboxes', th: 'หลายตัวเลือก' },
            short_text: { icon: '✏️', color: '#06b6d4', en: 'Short Answer', th: 'คำตอบสั้น' },
            long_text: { icon: '📝', color: '#0ea5e9', en: 'Long Answer', th: 'คำตอบยาว' },
            rating: { icon: '⭐', color: '#f59e0b', en: 'Rating', th: 'คะแนนดาว' },
            scale: { icon: '📊', color: '#10b981', en: 'Linear Scale', th: 'สเกล' },
            dropdown: { icon: '🔽', color: '#ec4899', en: 'Dropdown', th: 'รายการ' },
            date: { icon: '📅', color: '#f97316', en: 'Date', th: 'วันที่' },
            yes_no: { icon: '✅', color: '#14b8a6', en: 'Yes / No', th: 'ใช่ / ไม่' }
        };
        return info[type] || { icon: '❓', color: '#64748b', en: type, th: type };
    }
};

// ── TOAST ────────────────────────────────────────────────────────
const Toast = {
    show(msg, type = 'success', duration = 3000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 300); }, duration);
    }
};

// ── MODAL ────────────────────────────────────────────────────────
const Modal = {
    open(id) {
        const el = document.getElementById(id);
        if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
    },
    close(id) {
        const el = document.getElementById(id);
        if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
    },
    confirm(msg, onConfirm, lang = 'en') {
        const id = 'confirm-modal';
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id; el.className = 'modal-overlay';
            el.innerHTML = `<div class="modal" style="max-width:400px"><div class="modal-header"><span class="modal-title">⚠️ ${lang === 'th' ? 'ยืนยัน' : 'Confirm'}</span></div><p style="color:var(--text-secondary);margin-bottom:20px"></p><div class="modal-footer"><button class="btn btn-secondary" id="confirm-no">${lang === 'th' ? 'ยกเลิก' : 'Cancel'}</button><button class="btn btn-danger" id="confirm-yes">${lang === 'th' ? 'ยืนยัน' : 'Confirm'}</button></div></div>`;
            document.body.appendChild(el);
        }
        el.querySelector('p').textContent = msg;
        el.classList.add('open'); document.body.style.overflow = 'hidden';
        el.querySelector('#confirm-no').onclick = () => { el.classList.remove('open'); document.body.style.overflow = ''; };
        el.querySelector('#confirm-yes').onclick = () => { el.classList.remove('open'); document.body.style.overflow = ''; onConfirm(); };
    }
};

// ── COMPONENTS ───────────────────────────────────────────────────
const Components = {
    renderSidebar(activeLink, user) {
        const lang = I18n.lang;
        const isAdmin = user?.role === 'admin';
        const isCreator = user?.role === 'creator' || isAdmin;
        const initial = (user?.name || 'U')[0].toUpperCase();
        const roleLabel = { admin: isAdmin ? I18n.t('admin.roles.admin') : '', creator: I18n.t('admin.roles.creator'), respondent: I18n.t('admin.roles.respondent') }[user?.role] || '';

        let navItems = `
      <a class="nav-item${activeLink === 'dashboard' ? ' active' : ''}" href="dashboard.html">
        <span class="nav-icon">📊</span><span data-i18n="nav.dashboard">${I18n.t('nav.dashboard')}</span>
      </a>`;
        if (isCreator) navItems += `
      <a class="nav-item${activeLink === 'surveys' ? ' active' : ''}" href="dashboard.html?tab=surveys">
        <span class="nav-icon">📋</span><span>${I18n.t(isAdmin ? 'nav.allSurveys' : 'nav.surveys')}</span>
      </a>
      <a class="nav-item${activeLink === 'builder' ? ' active' : ''}" href="builder.html">
        <span class="nav-icon">✨</span><span data-i18n="nav.create">${I18n.t('nav.create')}</span>
      </a>
      <a class="nav-item${activeLink === 'results' ? ' active' : ''}" href="results.html">
        <span class="nav-icon">📈</span><span data-i18n="nav.results">${I18n.t('nav.results')}</span>
      </a>`;
        if (isAdmin) navItems += `
      <div class="nav-section-title" style="margin-top:12px">Admin</div>
      <a class="nav-item${activeLink === 'admin' ? ' active' : ''}" href="admin.html">
        <span class="nav-icon">👥</span><span data-i18n="nav.users">${I18n.t('nav.users')}</span>
      </a>`;

        return `
    <div class="sidebar-brand">
      <div class="sidebar-logo">📊</div>
      <div><div class="sidebar-title">${I18n.t('app.name')}</div><div class="sidebar-subtitle">${I18n.t('app.tagline')}</div></div>
    </div>
    <nav class="sidebar-nav">${navItems}</nav>
    <div class="sidebar-footer">
      <div class="user-card" onclick="Components.toggleUserMenu()">
        <div class="user-avatar">${initial}</div>
        <div style="flex:1;min-width:0"><div class="user-name truncate">${Utils.escapeHtml(user?.name || '')}</div><div class="user-role">${roleLabel}</div></div>
        <i class="fas fa-chevron-up" style="font-size:12px;color:var(--text-muted)"></i>
      </div>
      <div id="user-menu" class="dropdown-menu" style="bottom:70px;right:12px;left:12px;display:none">
        <div class="dropdown-item" onclick="window.location.href='dashboard.html'">🏠 ${I18n.t('nav.dashboard')}</div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item danger" onclick="Auth.logout()">🚪 ${I18n.t('nav.logout')}</div>
      </div>
    </div>`;
    },

    toggleUserMenu() {
        const m = document.getElementById('user-menu');
        if (m) { const isOpen = m.style.display === 'block'; m.style.display = isOpen ? 'none' : 'block'; }
    },

    renderTopbar(title, user) {
        return `
    <div class="topbar-left">
      <button class="icon-btn" onclick="Components.toggleSidebar()" style="display:none" id="sidebar-toggle">☰</button>
      <div class="topbar-title">${title}</div>
    </div>
    <div class="topbar-right">
      <div class="lang-toggle">
        <button class="lang-btn${I18n.lang === 'en' ? ' active' : ''}" data-lang="en" onclick="I18n.setLang('en')">EN</button>
        <button class="lang-btn${I18n.lang === 'th' ? ' active' : ''}" data-lang="th" onclick="I18n.setLang('th')">TH</button>
      </div>
      <div class="user-avatar" style="cursor:pointer" onclick="Components.toggleUserMenu()">${(user?.name || 'U')[0]}</div>
    </div>`;
    },

    toggleSidebar() {
        document.querySelector('.sidebar')?.classList.toggle('open');
    },

    init(activeLink) {
        const user = Auth.guard();
        if (!user) return null;
        const sidebarEl = document.querySelector('.sidebar');
        const topbarEl = document.querySelector('.topbar');
        if (sidebarEl) sidebarEl.innerHTML = this.renderSidebar(activeLink, user);
        if (topbarEl) topbarEl.innerHTML = this.renderTopbar(document.title.replace(' | SurveyBD', ''), user);
        document.addEventListener('click', e => {
            const menu = document.getElementById('user-menu');
            if (menu && !menu.contains(e.target) && !e.target.closest('.user-card')) {
                menu.style.display = 'none';
            }
        });
        return user;
    }
};

// ── INIT ─────────────────────────────────────────────────────────
DB.init();
