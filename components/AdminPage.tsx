import React, { useEffect, useState } from 'react';
import { UserDto, UserRole } from '../types';
import { getUsers, updateRole, forceVerify, resetPassword, deleteUser } from '../services/adminService';
import { Shield, RefreshCw, Trash2, CheckCircle, AlertCircle, Loader2, Users, KeyRound } from 'lucide-react';

const ROLES: UserRole[] = ['USER', 'MANAGER', 'ADMIN'];

const ROLE_STYLE: Record<UserRole, string> = {
  ADMIN:   'bg-red-500/20 text-red-400 border-red-500/30',
  MANAGER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  USER:    'bg-slate-700/50 text-slate-300 border-slate-600',
};

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch (e: any) {
      toast('err', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toast = (type: 'ok' | 'err', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  };

  const handleRoleChange = async (id: number, role: UserRole) => {
    setPendingId(id);
    try {
      const res = await updateRole(id, role);
      toast('ok', res.message);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch (e: any) {
      toast('err', e.message);
    } finally {
      setPendingId(null);
    }
  };

  const handleVerify = async (id: number) => {
    setPendingId(id);
    try {
      const res = await forceVerify(id);
      toast('ok', res.message);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, emailVerified: true } : u));
    } catch (e: any) {
      toast('err', e.message);
    } finally {
      setPendingId(null);
    }
  };

  const handleResetPassword = async (id: number, username: string) => {
    if (!window.confirm(`'${username}' 비밀번호를 아이디와 동일하게 초기화하시겠습니까?`)) return;
    setPendingId(id);
    try {
      const res = await resetPassword(id);
      toast('ok', res.message);
    } catch (e: any) {
      toast('err', e.message);
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (!window.confirm(`'${username}' 계정을 삭제하시겠습니까?`)) return;
    setPendingId(id);
    try {
      const res = await deleteUser(id);
      toast('ok', res.message);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      toast('err', e.message);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-600/20 p-2 rounded-lg border border-red-600/30">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">사용자 관리</h2>
            <p className="text-xs text-slate-500">총 {users.length}명</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 새로고침
        </button>
      </div>

      {/* Toast */}
      {actionMsg && (
        <div className={`mb-4 flex items-center gap-2 p-3 rounded-lg text-xs border ${
          actionMsg.type === 'ok'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {actionMsg.type === 'ok'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {actionMsg.text}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-800">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" /> 불러오는 중...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-600">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm">등록된 사용자가 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/70 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">아이디</th>
                <th className="px-4 py-3 text-left">이름</th>
                <th className="px-4 py-3 text-left">이메일</th>
                <th className="px-4 py-3 text-center">인증</th>
                <th className="px-4 py-3 text-center">권한</th>
                <th className="px-4 py-3 text-center">가입일</th>
                <th className="px-4 py-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-300">{user.username}</td>
                  <td className="px-4 py-3 text-white">{user.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    {user.emailVerified ? (
                      <span className="text-emerald-400 text-xs flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> 완료
                      </span>
                    ) : (
                      <button
                        onClick={() => handleVerify(user.id)}
                        disabled={pendingId === user.id}
                        className="text-xs px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                      >
                        미인증
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                      disabled={pendingId === user.id}
                      className={`text-xs px-2 py-1 rounded border bg-transparent cursor-pointer disabled:opacity-50 ${ROLE_STYLE[user.role]}`}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r} className="bg-slate-900 text-white">{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {pendingId === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500 mx-auto" />
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleResetPassword(user.id, user.username)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="비밀번호 초기화 (아이디와 동일)"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
