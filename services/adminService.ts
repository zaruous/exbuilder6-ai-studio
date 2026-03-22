import { UserDto, UserRole } from '../types';
import { getStoredUser } from './authService';

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/admin`;

function authHeaders(): Record<string, string> {
  const user = getStoredUser();
  return {
    'Content-Type': 'application/json',
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
    ...(user?.email ? { 'X-Current-User-Email': user.email } : {}),
  };
}

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '요청 실패');
  return data as T;
}

export const getUsers = () => request<UserDto[]>('GET', '/users');

export const updateRole = (id: number, role: UserRole) =>
  request<{ message: string }>('PUT', `/users/${id}/role`, { role });

export const forceVerify = (id: number) =>
  request<{ message: string }>('PUT', `/users/${id}/verify`);

export const deleteUser = (id: number) =>
  request<{ message: string }>('DELETE', `/users/${id}`);
