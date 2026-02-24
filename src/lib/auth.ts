import type { Session, User, Role } from '@/types';
import * as DB from './db';

export const login = (email: string, password: string): { success: boolean; user?: User } => {
    const user = DB.getUsers().find(u => u.email === email && u.password === password && u.isActive);
    if (user) {
        DB.setSession(user);
        DB.saveLog({ userId: user.id, userName: user.name, action: 'login', timestamp: new Date().toISOString() });
        return { success: true, user };
    }
    return { success: false };
};

export const logout = (): void => {
    const user = DB.getSession();
    if (user) {
        DB.saveLog({ userId: user.id, userName: user.name, action: 'logout', timestamp: new Date().toISOString() });
    }
    DB.clearSession();
    window.location.href = '/';
};

export const getUser = (): Session | null => DB.getSession();

export const guard = (requiredRole?: Role): Session | null => {
    if (typeof window === 'undefined') return null;
    const user = DB.getSession();
    if (!user) { window.location.href = '/'; return null; }
    if (requiredRole) {
        const hierarchy: Record<Role, number> = { admin: 3, creator: 2, respondent: 1 };
        if (hierarchy[user.role] < hierarchy[requiredRole]) {
            window.location.href = '/dashboard'; return null;
        }
    }
    return user;
};

const PERMS: Record<Role, string[]> = {
    admin: ['manage_users', 'create_survey', 'view_all_surveys', 'view_all_responses', 'publish_survey', 'delete_survey'],
    creator: ['create_survey', 'view_own_surveys', 'view_own_responses', 'publish_survey'],
    respondent: ['fill_survey'],
};

export const can = (user: Session | null, action: string): boolean =>
    (PERMS[user?.role ?? 'respondent'] ?? []).includes(action);
