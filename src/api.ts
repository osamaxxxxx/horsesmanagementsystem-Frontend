import type { Auth } from './types';

export const API_URL: string = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

const STORAGE_KEY = 'hv_auth';

// `code` is the API's machine-readable error code (or a client-side one such as NETWORK); the UI translates it.
// `message` is the server's own text when it sent one.
export class ApiError extends Error {
    constructor(message: string, public status: number, public code?: string) {
        super(message);
    }
}

let token: string | null = null;
let onAuthLost: (code: string) => void = () => {};

export function setAuthLostHandler(handler: (code: string) => void) {
    onAuthLost = handler;
}

export function loadAuth(): Auth | null {
    try {
        const auth = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Auth | null;
        token = auth?.token ?? null;
        return auth;
    } catch {
        return null;
    }
}

export function saveAuth(auth: Auth) {
    token = auth.token;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

// Drops the session so nothing is left behind after logout or revocation. Language and theme choices are kept.
export function clearAuth() {
    token = null;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.clear();
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
    let res: Response;
    try {
        res = await fetch(API_URL + path, {
            method,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
            },
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch {
        throw new ApiError('', 0, 'NETWORK');
    }
    if (res.ok) return res;

    const problem = await res.json().catch(() => ({}));
    const code: string =
        problem.code ??
        (problem.errors ? 'VALIDATION' : res.status === 403 ? 'FORBIDDEN' : res.status === 429 ? 'RATE_LIMITED' : 'UNKNOWN');
    const error = new ApiError(problem.detail ?? '', res.status, code);

    // A 401 on an authenticated call means the session is gone (expired, ended, or revoked).
    if (res.status === 401 && token) onAuthLost(code);
    throw error;
}

export async function api<T = void>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await send(method, path, body);
    return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function download(path: string, filename: string) {
    const blob = await (await send('GET', path)).blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
