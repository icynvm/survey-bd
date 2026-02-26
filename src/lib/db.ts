import { supabase } from './supabase';
import type { User, Survey, SurveyResponse, Session, Log } from '@/types';

// Helper to map DB snake_case to Frontend camelCase for Surveys
const mapSurvey = (s: any): Survey => ({
    id: s.id,
    title: s.title,
    titleTh: s.title_th,
    description: s.description,
    descriptionTh: s.description_th,
    creatorId: s.creator_id,
    status: s.status,
    questions: s.questions || [],
    settings: s.settings || {},
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    publishedAt: s.published_at
});

const KEYS = {
    session: 'sv_session',
    lang: 'survey_lang',
} as const;

// ── Users ────────────────────────────────────────────────────────
export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) { console.error('Error fetching users:', error); return []; }
    return data.map((u: any) => ({
        id: u.id, name: u.name, email: u.email, password: u.password,
        role: u.role, isActive: u.is_active, createdAt: u.created_at
    }));
};

export const getUserById = async (id: string): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return null;
    return {
        id: data.id, name: data.name, email: data.email, password: data.password,
        role: data.role, isActive: data.is_active, createdAt: data.created_at
    };
};

export const saveUsers = async (users: User[]): Promise<void> => {
    const upserts = users.map(u => ({
        id: u.id, name: u.name, email: u.email, password: u.password,
        role: u.role, is_active: u.isActive, created_at: u.createdAt
    }));
    await supabase.from('users').upsert(upserts);
};

// ── Surveys ──────────────────────────────────────────────────────
export const getSurveys = async (): Promise<Survey[]> => {
    const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching surveys:', error); return []; }
    return data.map(mapSurvey);
};

export const getSurveyById = async (id: string): Promise<Survey | null> => {
    const { data, error } = await supabase.from('surveys').select('*').eq('id', id).single();
    if (error) return null;
    return mapSurvey(data);
};

export const saveSurvey = async (survey: Survey): Promise<void> => {
    const data = {
        id: survey.id,
        title: survey.title,
        title_th: survey.titleTh,
        description: survey.description,
        description_th: survey.descriptionTh,
        creator_id: survey.creatorId,
        status: survey.status,
        questions: survey.questions,
        settings: survey.settings,
        published_at: survey.publishedAt
    };
    await supabase.from('surveys').upsert(data);
};

export const deleteSurvey = async (id: string): Promise<void> => {
    await supabase.from('surveys').delete().eq('id', id);
};

// ── Responses ────────────────────────────────────────────────────
export const getResponses = async (): Promise<SurveyResponse[]> => {
    const { data, error } = await supabase.from('responses').select('*').order('submitted_at', { ascending: false });
    if (error) return [];
    return data.map((r: any) => ({
        id: r.id, surveyId: r.survey_id, respondentId: r.respondent_id,
        respondentName: r.respondent_name, answers: r.answers,
        submittedAt: r.submitted_at, completionTime: r.completion_time
    }));
};

export const getResponsesBySurvey = async (surveyId: string): Promise<SurveyResponse[]> => {
    const { data, error } = await supabase.from('responses').select('*').eq('survey_id', surveyId).order('submitted_at', { ascending: false });
    if (error) return [];
    return data.map((r: any) => ({
        id: r.id, surveyId: r.survey_id, respondentId: r.respondent_id,
        respondentName: r.respondent_name, answers: r.answers,
        submittedAt: r.submitted_at, completionTime: r.completion_time
    }));
};

export const saveResponse = async (resp: SurveyResponse): Promise<void> => {
    const data = {
        id: resp.id,
        survey_id: resp.surveyId,
        respondent_id: resp.respondentId,
        respondent_name: resp.respondentName,
        answers: resp.answers,
        submitted_at: resp.submittedAt,
        completion_time: resp.completionTime
    };
    await supabase.from('responses').insert(data);
};

// ── Cookie Helpers ───────────────────────────────────────────────
const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (name: string, value: string, days = 7): void => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
};

const deleteCookie = (name: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

const generateToken = (): string => {
    const arr = new Uint8Array(32);
    if (typeof crypto !== 'undefined') crypto.getRandomValues(arr);
    else for (let i = 0; i < 32; i++) arr[i] = Math.floor(Math.random() * 256);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
};

// ── Session (Supabase + Cookie) ──────────────────────────────────
let _cachedSession: Session | null = null;

export const getSession = (): Session | null => {
    // Return in-memory cache (set after login or init)
    return _cachedSession;
};

export const loadSession = async (): Promise<Session | null> => {
    const token = getCookie(KEYS.session);
    if (!token) { _cachedSession = null; return null; }

    // Validate token against Supabase sessions table
    const { data: session, error } = await supabase
        .from('sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .single();

    if (error || !session) {
        deleteCookie(KEYS.session);
        _cachedSession = null;
        return null;
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
        await supabase.from('sessions').delete().eq('token', token);
        deleteCookie(KEYS.session);
        _cachedSession = null;
        return null;
    }

    // Fetch user data
    const user = await getUserById(session.user_id);
    if (!user || !user.isActive) {
        await supabase.from('sessions').delete().eq('token', token);
        deleteCookie(KEYS.session);
        _cachedSession = null;
        return null;
    }

    _cachedSession = { id: user.id, name: user.name, email: user.email, role: user.role };
    return _cachedSession;
};

export const setSession = async (user: User): Promise<void> => {
    // Clear any existing session for this user
    await supabase.from('sessions').delete().eq('user_id', user.id);

    const token = generateToken();
    await supabase.from('sessions').insert({
        user_id: user.id,
        token,
        expires_at: new Date(Date.now() + 7 * 864e5).toISOString()
    });

    setCookie(KEYS.session, token, 7);
    _cachedSession = { id: user.id, name: user.name, email: user.email, role: user.role };
};

export const clearSession = async (): Promise<void> => {
    const token = getCookie(KEYS.session);
    if (token) {
        await supabase.from('sessions').delete().eq('token', token);
    }
    deleteCookie(KEYS.session);
    _cachedSession = null;
};

export const saveLog = async (log: Log): Promise<void> => {
    const data = {
        user_id: log.userId,
        action: log.action,
        metadata: log.metadata || {}
    };
    await supabase.from('logs').insert(data);
};

export const getLogs = async (): Promise<Log[]> => {
    const { data, error } = await supabase.from('logs').select('*').order('created_at', { ascending: false });
    if (error) { console.error('Error fetching logs:', error); return []; }
    return data.map((l: any) => ({
        id: l.id,
        userId: l.user_id,
        action: l.action,
        metadata: l.metadata,
        createdAt: l.created_at
    }));
};

// ── File Uploads (Supabase Storage) ─────────────────────────────
export const uploadFile = async (file: File, responseId: string, questionId: string): Promise<{ path: string; url: string } | null> => {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${responseId}/${questionId}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const { error } = await supabase.storage
        .from('survey-files')
        .upload(path, file, { contentType: file.type, upsert: false });

    if (error) { console.error('Upload error:', error); return null; }

    const { data: urlData } = supabase.storage.from('survey-files').getPublicUrl(path);
    return { path, url: urlData.publicUrl };
};

export const saveFileUpload = async (meta: { id: string; responseId: string; questionId: string; fileName: string; fileSize: number; fileType: string; storagePath: string }): Promise<void> => {
    await supabase.from('file_uploads').insert({
        id: meta.id,
        response_id: meta.responseId,
        question_id: meta.questionId,
        file_name: meta.fileName,
        file_size: meta.fileSize,
        file_type: meta.fileType,
        storage_path: meta.storagePath
    });
};

export const getFileUrl = (path: string): string => {
    const { data } = supabase.storage.from('survey-files').getPublicUrl(path);
    return data.publicUrl;
};

export const getFileUploads = async (responseId: string): Promise<any[]> => {
    const { data, error } = await supabase.from('file_uploads').select('*').eq('response_id', responseId);
    if (error) { console.error('Error fetching file uploads:', error); return []; }
    return data.map((f: any) => ({
        id: f.id,
        responseId: f.response_id,
        questionId: f.question_id,
        fileName: f.file_name,
        fileSize: f.file_size,
        fileType: f.file_type,
        storagePath: f.storage_path,
        uploadedAt: f.uploaded_at
    }));
};

// ── Seed Data Logic (Now needs to be called carefully) ──────────
export const initDB = async (): Promise<void> => {
    // Clean up ALL legacy localStorage data (security: removes plaintext passwords etc.)
    if (typeof window !== 'undefined') {
        const legacyKeys = ['sv_users', 'sv_surveys', 'sv_responses', 'sv_logs', 'sv_session', 'survey_lang'];
        legacyKeys.forEach(key => {
            try { localStorage.removeItem(key); } catch { /* ignore */ }
        });
    }

    // Check if Supabase has seed data
    const users = await getUsers();
    if (users.length > 0) return;

    // ... (seeding managed via Supabase dashboard)
};
