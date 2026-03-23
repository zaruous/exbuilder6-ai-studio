import { AuthUser } from '../types';
import { APP_CONFIG } from './Const';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/auth`;
const AUTH_KEY = APP_CONFIG.authKey;

async function post(path: string, body: object): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || '요청 처리 중 오류가 발생했습니다.');
  }
  return data;
}

export async function register(name: string, username: string, email: string, password: string): Promise<{ message: string; emailVerified: boolean }> {
  const data = await post('/register', { name, username, email, password });
  return { message: data.message, emailVerified: data.emailVerified ?? false };
}

export async function verifyEmail(email: string, code: string): Promise<string> {
  const data = await post('/verify-email', { email, code });
  return data.message;
}

export async function resendCode(email: string): Promise<string> {
  const data = await post('/resend-code', { email });
  return data.message;
}

export async function login(loginId: string, password: string): Promise<AuthUser> {
  const data = await post('/login', { loginId, password });
  const user: AuthUser = {
    username: data.username,
    email: data.email,
    name: data.name,
    role: data.role,
    token: data.token,
  };
  saveUser(user);
  return user;
}

export function saveUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export async function getPasswordPolicy(): Promise<{ pattern: string; message: string; verificationEnabled: boolean }> {
  const res = await fetch(`${API_BASE}/password-policy`);
  return res.json();
}

export async function forgotPassword(email: string): Promise<string> {
  const res = await fetch(`${API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '요청 실패');
  return data.message;
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<string> {
  const res = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '요청 실패');
  return data.message;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<string> {
  const user = getStoredUser();
  const res = await fetch(`${API_BASE}/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '비밀번호 변경 실패');
  return data.message;
}

export function getAuthHeader(): Record<string, string> {
  const user = getStoredUser();
  if (user?.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
}
