import React, { useState, useEffect } from 'react';
import { KeyRound, X, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { changePassword, getPasswordPolicy } from '../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [policy, setPolicy] = useState<{ pattern: string; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getPasswordPolicy().then(setPolicy).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (policy && !new RegExp(policy.pattern).test(newPassword)) {
      setMsg({ type: 'err', text: policy.message });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const message = await changePassword(currentPassword, newPassword);
      setMsg({ type: 'ok', text: message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600/20 p-1.5 rounded-lg border border-blue-600/30">
              <KeyRound className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-sm font-bold text-white">비밀번호 변경</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-xs border ${
              msg.type === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {msg.type === 'ok'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {msg.text}
            </div>
          )}

          <PasswordField
            label="현재 비밀번호"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent(v => !v)}
            autoFocus
          />
          <PasswordField
            label="새 비밀번호"
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew(v => !v)}
            hint={policy?.message}
            pattern={policy?.pattern}
          />
          <PasswordField
            label="새 비밀번호 확인"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm(v => !v)}
            isConfirm
            matchTarget={newPassword}
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              변경하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoFocus?: boolean;
  isConfirm?: boolean;
  matchTarget?: string;
  hint?: string;
  pattern?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  label, value, onChange, show, onToggleShow, autoFocus, isConfirm, matchTarget, hint, pattern,
}) => {
  const mismatch = isConfirm && value.length > 0 && value !== matchTarget;
  const patternMismatch = !isConfirm && pattern && value.length > 0 && !new RegExp(pattern).test(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-400 font-medium">{label}</label>
      <div className={`flex items-center bg-slate-800 border rounded-xl px-3 transition-all ${
        mismatch || patternMismatch ? 'border-red-500/50' : 'border-slate-700 focus-within:border-blue-500/50'
      }`}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="text-slate-500 hover:text-slate-300 transition-colors ml-2"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {patternMismatch && <p className="text-[10px] text-red-400">{hint}</p>}
      {!patternMismatch && hint && value.length === 0 && (
        <p className="text-[10px] text-slate-500">{hint}</p>
      )}
      {mismatch && <p className="text-[10px] text-red-400">비밀번호가 일치하지 않습니다.</p>}
    </div>
  );
};

export default ChangePasswordModal;
