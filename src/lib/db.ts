import type { User, Survey, SurveyResponse, Session } from '@/types';

const KEYS = {
    users: 'sv_users',
    surveys: 'sv_surveys',
    responses: 'sv_responses',
    session: 'sv_session',
    lang: 'survey_lang',
} as const;

function get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}
function set(key: string, data: unknown): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

// ── Users ────────────────────────────────────────────────────────
export const getUsers = (): User[] => get<User[]>(KEYS.users) ?? [];
export const saveUsers = (u: User[]): void => set(KEYS.users, u);
export const getUserById = (id: string): User | null => getUsers().find(u => u.id === id) ?? null;

// ── Surveys ──────────────────────────────────────────────────────
export const getSurveys = (): Survey[] => get<Survey[]>(KEYS.surveys) ?? [];
export const saveSurveys = (s: Survey[]): void => set(KEYS.surveys, s);
export const getSurveyById = (id: string): Survey | null => getSurveys().find(s => s.id === id) ?? null;
export const saveSurvey = (survey: Survey): void => {
    const list = getSurveys();
    const idx = list.findIndex(s => s.id === survey.id);
    if (idx >= 0) list[idx] = survey; else list.push(survey);
    saveSurveys(list);
};
export const deleteSurvey = (id: string): void => {
    saveSurveys(getSurveys().filter(s => s.id !== id));
    saveResponses(getResponses().filter(r => r.surveyId !== id));
};

// ── Responses ────────────────────────────────────────────────────
export const getResponses = (): SurveyResponse[] => get<SurveyResponse[]>(KEYS.responses) ?? [];
export const saveResponses = (r: SurveyResponse[]): void => set(KEYS.responses, r);
export const getResponsesBySurvey = (surveyId: string): SurveyResponse[] =>
    getResponses().filter(r => r.surveyId === surveyId);
export const saveResponse = (resp: SurveyResponse): void => {
    const list = getResponses();
    list.push(resp);
    saveResponses(list);
};

// ── Session ──────────────────────────────────────────────────────
export const getSession = (): Session | null => get<Session>(KEYS.session);
export const setSession = (user: User): void =>
    set(KEYS.session, { id: user.id, name: user.name, email: user.email, role: user.role });
export const clearSession = (): void => {
    if (typeof window !== 'undefined') localStorage.removeItem(KEYS.session);
};

// ── Seed Data ────────────────────────────────────────────────────
export const initDB = (): void => {
    if (typeof window === 'undefined') return;
    if (getUsers().length > 0) return;

    const users: User[] = [
        { id: 'u1', name: 'Super Admin', email: 'admin@survey.com', password: 'admin123', role: 'admin', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
        { id: 'u2', name: 'Kanokkwan Sangsan', email: 'creator@survey.com', password: 'creator123', role: 'creator', isActive: true, createdAt: '2026-01-15T00:00:00Z' },
        { id: 'u3', name: 'Somchai Jaidee', email: 'user@survey.com', password: 'user123', role: 'respondent', isActive: true, createdAt: '2026-02-01T00:00:00Z' },
    ];
    saveUsers(users);

    const surveys: Survey[] = [
        {
            id: 's1', title: 'Customer Satisfaction Survey', titleTh: 'แบบสอบถามความพึงพอใจลูกค้า',
            description: 'Help us improve our services by sharing your experience.',
            descriptionTh: 'ช่วยเราปรับปรุงบริการโดยแบ่งปันประสบการณ์ของคุณ',
            creatorId: 'u2', status: 'published',
            questions: [
                { id: 'q1', type: 'rating', title: 'How satisfied are you with our service?', titleTh: 'คุณพึงพอใจบริการของเราเพียงใด?', required: true },
                { id: 'q2', type: 'multiple_choice', title: 'How did you hear about us?', titleTh: 'คุณรู้จักเราได้อย่างไร?', required: true, options: ['Social Media', 'Friend Referral', 'Search Engine', 'Advertisement', 'Other'], optionsTh: ['โซเชียลมีเดีย', 'เพื่อนแนะนำ', 'เครื่องมือค้นหา', 'โฆษณา', 'อื่นๆ'] },
                { id: 'q3', type: 'long_text', title: 'What improvements would you suggest?', titleTh: 'คุณมีข้อเสนอแนะอย่างไรบ้าง?', required: false },
                { id: 'q4', type: 'yes_no', title: 'Would you recommend us to others?', titleTh: 'คุณจะแนะนำเราให้คนอื่นหรือไม่?', required: true },
            ],
            settings: { allowMultiple: false, showProgress: true, anonymous: false },
            createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z', publishedAt: '2026-02-01T09:00:00Z',
        },
        {
            id: 's2', title: 'Employee Engagement Survey', titleTh: 'แบบสอบถามความผูกพันพนักงาน',
            description: 'Annual employee engagement and satisfaction survey.',
            descriptionTh: 'แบบสอบถามความผูกพันและความพึงพอใจพนักงานประจำปี',
            creatorId: 'u2', status: 'draft',
            questions: [
                { id: 'q5', type: 'scale', title: 'Rate your overall job satisfaction (1-10)', titleTh: 'ให้คะแนนความพึงพอใจในงานโดยรวม (1-10)', required: true, minValue: 1, maxValue: 10, minLabel: 'Very Dissatisfied', maxLabel: 'Very Satisfied' },
                { id: 'q6', type: 'checkboxes', title: 'Which benefits do you value most?', titleTh: 'สวัสดิการใดที่คุณให้คุณค่ามากที่สุด?', required: false, options: ['Health Insurance', 'Remote Work', 'Training', 'Salary', 'Annual Leave'], optionsTh: ['ประกันสุขภาพ', 'ทำงานจากบ้าน', 'การฝึกอบรม', 'เงินเดือน', 'วันลาประจำปี'] },
            ],
            settings: { allowMultiple: false, showProgress: true, anonymous: true },
            createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z', publishedAt: null,
        },
    ];
    saveSurveys(surveys);

    const names = ['Alice Johnson', 'Bob Smith', 'Carol White', 'David Brown', 'Emma Davis'];
    const responses: SurveyResponse[] = Array.from({ length: 8 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 14));
        return {
            id: `r${i + 1}`, surveyId: 's1', respondentId: null,
            respondentName: names[i % names.length],
            answers: {
                q1: Math.floor(Math.random() * 3) + 3,
                q2: ['Social Media', 'Friend Referral', 'Search Engine', 'Advertisement', 'Other'][Math.floor(Math.random() * 5)],
                q3: ['Great service!', 'Could be faster', 'Very helpful team', 'Excellent experience'][i % 4],
                q4: Math.random() > 0.2 ? 'yes' : 'no',
            },
            submittedAt: d.toISOString(), completionTime: Math.floor(Math.random() * 180) + 60,
        };
    });
    saveResponses(responses);
};
