import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { X, User as UserIcon, Building2, KeyRound, Mail, Phone, Lock, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onLogin: (data: { email: string; password: string }) => Promise<void>;
  onRegister: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: 'user' | 'owner';
  }) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onLogin,
  onRegister
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'user' | 'owner'>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await onLogin({ email, password });
      } else {
        await onRegister({ name, email, phone, password, role });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 text-slate-800">
        {/* Header Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-all cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-200 mb-1">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Welcome Back to Landmark' : 'Join Landmark RoomFinder'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Access your saved rooms, inquiries, or property listings'
              : 'Choose your account type and start connecting'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex gap-1.5 mx-6 mt-4 rounded-full">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'user'
                      ? 'bg-blue-50 border-blue-600 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <UserIcon className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Renter / User</p>
                    <p className="text-[10px] text-slate-500">Search & contact</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    role === 'owner'
                      ? 'bg-blue-50 border-blue-600 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Property Owner</p>
                    <p className="text-[10px] text-slate-500">Post & manage rooms</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Register Name */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-600">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone for Register */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Phone Number</label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-1111"
                  className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Password</label>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-blue-600">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-200 transition-colors cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to Account'
              : `Create ${role === 'owner' ? 'Owner' : 'User'} Account`}
          </button>
        </form>
      </div>
    </div>
  );
};
