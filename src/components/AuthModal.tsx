import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, rtdb } from '../services/firebase';
import { ref, set, get } from 'firebase/database';
import { 
  TrendingUp, 
  Lock, 
  Mail, 
  UserCheck, 
  UserPlus, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  X 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        if (name.trim()) {
          await updateProfile(user, { displayName: name.trim() });
        }

        // Initialize user balance in Realtime Database (100 Juta IDR demo balance)
        try {
          const userRef = ref(rtdb, `users/${user.uid}`);
          await set(userRef, {
            email: user.email,
            displayName: name.trim() || user.email?.split('@')[0],
            balance: 100000000,
            currency: 'IDR',
            createdAt: Date.now()
          });
        } catch (dbErr) {
          console.warn('Realtime DB user record fallback:', dbErr);
        }

        onClose?.();
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onClose?.();
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      let message = 'Terjadi kesalahan. Silakan coba lagi.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'Email ini sudah terdaftar. Silakan pilih tab "Masuk Akun".';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Format alamat email tidak valid.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Kata sandi minimal 6 karakter.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Email atau kata sandi tidak cocok.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@tradingtraining.com');
      setPassword('admin123456');
      setName('Master Admin');
    } else {
      setEmail('trader.demo@tradingtraining.com');
      setPassword('demo123456');
      setName('Demo Trader');
    }
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0e131d] border border-[#222c3f] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Banner */}
        <div className="relative p-6 bg-gradient-to-br from-[#131c2d] to-[#0e131d] border-b border-[#1f293d] text-center">
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
            <TrendingUp className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Trading Simulation Training
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'register'
              ? 'Daftarkan akun simulasi Anda untuk mulai berlatih trading real-time.'
              : 'Masuk ke akun Anda untuk melanjutkan riwayat dan posisi trading.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 bg-[#121824] border-b border-[#1f293d] text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar Akun Baru</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Masuk Akun</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Nama Lengkap / Username</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Contoh: Budi Trader"
                className="w-full bg-[#141b27] border border-[#222d40] focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-slate-100 text-xs outline-none transition-colors"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Alamat Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full bg-[#141b27] border border-[#222d40] focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-slate-100 font-mono text-xs outline-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Kata Sandi (Password)</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-[#141b27] border border-[#222d40] focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-slate-100 font-mono text-xs outline-none transition-colors"
            />
          </div>

          {mode === 'register' && (
            <div className="p-2.5 bg-[#131b29] border border-[#1e283b] rounded-lg text-[11px] text-slate-400">
              🎁 Bonus Registrasi Akun: Saldo modal demo latihan sebesar <strong className="text-emerald-400">Rp 100,000,000</strong> akan langsung aktif di akun Anda.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-lg"
          >
            {loading ? 'Memproses Akun...' : mode === 'register' ? 'Daftar Akun Sekarang' : 'Masuk ke Platform'}
          </button>

          {/* Quick Auto-fills for Testing */}
          <div className="pt-3 border-t border-[#1d273a] space-y-2">
            <span className="text-[11px] text-slate-500 block text-center">
              Atau coba cepat tanpa ketik manual:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('user')}
                className="py-1.5 px-2 bg-[#141b27] hover:bg-[#1c2536] text-slate-300 rounded border border-[#222d40] text-[11px] transition-colors"
              >
                Isi Akun Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('admin')}
                className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 text-[11px] transition-colors"
              >
                Isi Akun Admin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
