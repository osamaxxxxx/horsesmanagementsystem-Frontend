import type { PlotPatch, PlotStatus, UserRole } from './types';

export const STATUSES: PlotStatus[] = ['ACTIVE', 'WITHDRAWN', 'IN_PROGRESS', 'SWAPPED', 'COMPLETED'];
export const ROLES: UserRole[] = ['SUPER_ADMIN_REPORTER', 'PRESIDENT', 'ENGINEER_INSPECTOR'];

// Colour coding per status. Labels live in the translations (status.*).
export const statusMeta: Record<PlotStatus, { badge: string; dot: string; bar: string; text: string; icon: string }> = {
    ACTIVE: {
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
        dot: 'bg-emerald-500',
        bar: 'border-s-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400',
        icon: 'fa-file-contract'
    },
    WITHDRAWN: {
        badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
        dot: 'bg-rose-500',
        bar: 'border-s-rose-500',
        text: 'text-rose-700 dark:text-rose-400',
        icon: 'fa-triangle-exclamation'
    },
    IN_PROGRESS: {
        badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
        dot: 'bg-amber-500',
        bar: 'border-s-amber-500',
        text: 'text-amber-700 dark:text-amber-400',
        icon: 'fa-hourglass-half'
    },
    SWAPPED: {
        badge: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/40',
        dot: 'bg-sky-500',
        bar: 'border-s-sky-500',
        text: 'text-sky-700 dark:text-sky-400',
        icon: 'fa-arrow-right-arrow-left'
    },
    COMPLETED: {
        badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/40',
        dot: 'bg-purple-500',
        bar: 'border-s-purple-500',
        text: 'text-purple-700 dark:text-purple-400',
        icon: 'fa-building-circle-check'
    }
};

// Fields each role may change on an existing plot; mirrors the API's PATCH rules. The reporter may change everything.
const patchableFields: Record<Exclude<UserRole, 'SUPER_ADMIN_REPORTER'>, (keyof PlotPatch)[]> = {
    PRESIDENT: ['status', 'notes', 'requestsAndDecisions'],
    ENGINEER_INSPECTOR: ['status', 'buildingPermits']
};

export const isAdmin = (role: UserRole) => role === 'SUPER_ADMIN_REPORTER';

export const canEditField = (role: UserRole, field: string) =>
    isAdmin(role) || (patchableFields[role] as string[]).includes(field);

export const editableFields = (role: Exclude<UserRole, 'SUPER_ADMIN_REPORTER'>) => patchableFields[role];
