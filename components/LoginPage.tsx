import React, { useState, useEffect } from 'react';
import { Cpu, Mail, Lock, AlertCircle, Loader2, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { login, forgotPassword, resetPassword, getPasswordPolicy } from '../services/authService';
import { AuthUser } from '../types';

type View = 'login' | 'forgot-email' | 'forgot-reset';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onGoToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToRegister }) => {
  const [view, setView] = useState<View>('login');
  const [verificationEnabled, setVerificationEnabled] = useState(false);
  const [policy, setPolicy] = useState<{ pattern: string; message: string } | null>(null);

  // Login state
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password state
  const [fpEmail, setFpEmail] = useState('');
  const [fpCode, setFpCode] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpShowPassword, setFpShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getPasswordPolicy().then(p => {
      setVerificationEnabled(p.verificationEnabled);
      setPolicy({ pattern: p.pattern, message: p.message });
    }).catch(() => {});
  }, []);

  const clearMessages = () => { setError(null); setSuccess(null); };

  const goToView = (v: View) => { clearMessages(); setView(v); };

  // ── 로그인 ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) return;
    setLoading(true);
    clearMessages();
    try {
      const user = await login(loginId, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 이메일 발송 ──
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      const msg = await forgotPassword(fpEmail);
      setSuccess(msg);
      goToView('forgot-reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 코드 재발송 ──
  const handleResend = async () => {
    setLoading(true);
    clearMessages();
    try {
      const msg = await forgotPassword(fpEmail);
      setSuccess(msg);
      setFpCode('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 비밀번호 재설정 ──
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (policy && !new RegExp(policy.pattern).test(fpNewPassword)) {
      setError(policy.message);
      return;
    }
    setLoading(true);
    clearMessages();
    try {
      const msg = await resetPassword(fpEmail, fpCode, fpNewPassword);
      setSuccess(msg);
      setTimeout(() => { goToView('login'); setFpEmail(''); setFpCode(''); setFpNewPassword(''); }, 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4">
            <Cpu className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">eXbuilder6 AI Studio</h1>
          <p className="text-slate-400 text-sm mt-1">
            {view === 'login' ? '로그인하여 시작하세요' :
             view === 'forgot-email' ? '비밀번호 찾기' : '새 비밀번호 설정'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

          {/* ── 로그인 폼 ── */}
          {view === 'login' && (
            <>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">아이디 또는 이메일</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={loginId}
                      onChange={e => setLoginId(e.target.value)}
                      placeholder="아이디 또는 이메일"
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">비밀번호</label>
                    {verificationEnabled && (
                      <button
                        type="button"
                        onClick={() => goToView('forgot-email')}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        비밀번호 찾기
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                {error && <ErrorBox text={error} />}

                <button
                  type="submit"
                  disabled={loading || !loginId || !password}
                  className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 로그인 중...</> : '로그인'}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                계정이 없으신가요?{' '}
                <button onClick={onGoToRegister} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  회원가입
                </button>
              </div>
            </>
          )}

          {/* ── 비밀번호 찾기: 이메일 입력 ── */}
          {view === 'forgot-email' && (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                가입 시 사용한 이메일을 입력하면 비밀번호 재설정 코드를 발송합니다.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
              </div>

              {error && <ErrorBox text={error} />}

              <button
                type="submit"
                disabled={loading || !fpEmail}
                className="mt-1 w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 발송 중...</> : '인증 코드 발송'}
              </button>

              <button type="button" onClick={() => goToView('login')} className="text-xs text-slate-500 hover:text-white text-center transition-colors">
                ← 로그인으로 돌아가기
              </button>
            </form>
          )}

          {/* ── 비밀번호 찾기: 코드 + 새 비밀번호 입력 ── */}
          {view === 'forgot-reset' && (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-xs">
                <strong>{fpEmail}</strong>로 6자리 코드를 발송했습니다. 메일함을 확인해주세요.
              </div>

              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">인증 코드 (6자리)</label>
                <input
                  type="text"
                  value={fpCode}
                  onChange={e => setFpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white text-center tracking-widest font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">새 비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={fpShowPassword ? 'text' : 'password'}
                    value={fpNewPassword}
                    onChange={e => setFpNewPassword(e.target.value)}
                    placeholder={policy?.message ?? '새 비밀번호 입력'}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setFpShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {fpShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {policy && <p className="text-[10px] text-slate-500">{policy.message}</p>}
              </div>

              {error && <ErrorBox text={error} />}

              <button
                type="submit"
                disabled={loading || fpCode.length !== 6 || !fpNewPassword}
                className="mt-1 w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 재설정 중...</> : '비밀번호 재설정'}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="w-full py-2 text-slate-400 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 인증 코드 재발송
              </button>

              <button type="button" onClick={() => goToView('login')} className="text-xs text-slate-500 hover:text-white text-center transition-colors">
                ← 로그인으로 돌아가기
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

const ErrorBox: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
    <AlertCircle className="w-4 h-4 flex-shrink-0" />
    <span>{text}</span>
  </div>
);

export default LoginPage;
