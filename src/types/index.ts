// ── Core Types ──────────────────────────────────────────────────

export type Role = 'admin' | 'creator' | 'respondent';
export type SurveyStatus = 'draft' | 'published' | 'closed';
export type QuestionType =
    | 'multiple_choice' | 'checkboxes' | 'short_text' | 'long_text'
    | 'rating' | 'scale' | 'dropdown' | 'date' | 'yes_no' | 'likert'
    | 'email' | 'phone' | 'address' | 'file_upload'
    | 'section';
export type Lang = 'en' | 'th';

export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    isActive: boolean;
    createdAt: string;
}

export interface Session {
    id: string;
    name: string;
    email: string;
    role: Role;
}

export interface Log {
    id?: string;
    userId: string;
    userName?: string;
    action: string;
    metadata?: any;
    timestamp?: string; // for legacy/helper
    createdAt?: string;
}

export interface Question {
    id: string;
    type: QuestionType;
    title: string;
    titleTh: string;
    description?: string;       // ← NEW: optional label/description below title
    descriptionTh?: string;     // ← NEW: Thai description
    required: boolean;
    options?: string[];
    optionsTh?: string[];
    hasOther?: boolean;         // ← NEW: show "Other" text box for choice questions
    // scale
    minValue?: number;
    maxValue?: number;
    minLabel?: string;
    maxLabel?: string;
    // likert
    likertRows?: string[];      // ← NEW: sub-questions in likert table
    likertRowsTh?: string[];
    likertRowHasOther?: boolean[]; // ← NEW: maps 1:1 with likertRows to show 'Please specify'
    likertScale?: string[];     // ← NEW: column labels e.g. ['Very Satisfied','Satisfied',...]
    likertScaleTh?: string[];
    // file upload
    maxFiles?: number;          // max number of files allowed (default 1)
    acceptedFileTypes?: string[]; // e.g. ['.pdf', '.jpg', '.png']
}

export interface SurveySettings {
    allowMultiple: boolean;
    showProgress: boolean;
    anonymous: boolean;
}

export interface Survey {
    id: string;
    title: string;
    titleTh: string;
    description: string;
    descriptionTh: string;
    creatorId: string;
    status: SurveyStatus;
    questions: Question[];
    settings: SurveySettings;
    createdAt: string;
    updatedAt: string;
    publishedAt: string | null;
}

export type AnswerValue = string | string[] | number | Record<string, string | number>;

export interface SurveyResponse {
    id: string;
    surveyId: string;
    respondentId: string | null;
    respondentName: string;
    answers: Record<string, AnswerValue>;
    submittedAt: string;
    completionTime: number;
}

export interface QuestionTypeInfo {
    icon: string;
    color: string;
    en: string;
    th: string;
}

export interface ToastMessage {
    id: string;
    msg: string;
    type: 'success' | 'error' | 'warning' | 'info';
}
