import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Icons } from '../components/common/Icons';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ─── Shared auth layout ───────────────────────────────────────────
function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-obsidian flex flex-col">
      {/* Top bar */}
      <div className="border-b border-obsidian-border px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex flex-col">
          <span className="font-display text-lg tracking-widest2 text-cream leading-none">JANELUX</span>
          <span className="font-sans text-[8px] tracking-widest3 text-gold/70 uppercase">BEADS</span>
        </Link>
        <Link to="/" className="text-cream/40 hover:text-gold text-xs tracking-widest uppercase transition-colors flex items-center gap-1">
          <Icons.ArrowRight size={12} className="rotate-180" /> Back to Store
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Decorative */}
          <div className="flex justify-center mb-8">
            <svg viewBox="0 0 60 60" className="w-14 h-14">
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E8C06A" /><stop offset="100%" stopColor="#A07828" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((_, i) => {
                const a = (i / 8) * Math.PI * 2;
                return <circle key={i} cx={30 + Math.cos(a) * 20} cy={30 + Math.sin(a) * 20} r="4" fill="url(#ag)" />;
              })}
              <circle cx="30" cy="30" r="6" fill="url(#ag)" />
            </svg>
          </div>

          <span className="section-label text-center block">{subtitle}</span>
          <h1 className="font-display text-4xl text-cream tracking-wide text-center mb-8">{title.toUpperCase()}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.full_name.split(' ')[0]}!`);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/account');
    } catch (err) {
      const msg = err.response?.data?.message;
      if (err.response?.data?.needs_verification) {
        toast.error('Please verify your email first');
        navigate(`/register?verify=${err.response.data.user_id}`);
      } else {
        toast.error(msg || 'Login failed');
      }
    } finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>Sign In — Janelux Beads</title></Helmet>
      <AuthShell title="Sign In" subtitle="Welcome Back">
        <form onSubmit={handle} className="space-y-4" autoComplete="off">
          <div>
            <label className="section-label text-[10px]">Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-dark" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="section-label text-[10px]">Password</label>
            <input type="password" autoComplete="current-password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-dark" placeholder="••••••••" required />
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-gold/60 hover:text-gold text-xs transition-colors">Forgot password?</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full mt-2 disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-cream/40 text-xs mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-gold hover:text-gold-light transition-colors">Create one</Link>
        </p>
      </AuthShell>
    </>
  );
}

// ─── Register Page ────────────────────────────────────────────────
export function RegisterPage() {
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      setUserId(res.data.user_id);
      setStep('verify');
      toast.success('Verification code sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { user_id: userId, otp: code });
      login(res.data.token, res.data.user);
      toast.success('Email verified! Welcome to Janelux Beads 🎉');
      navigate('/account');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const resendOtp = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { user_id: userId });
      toast.success('New code sent!');
    } catch { toast.error('Failed to resend'); } finally { setResending(false); }
  };

  if (step === 'verify') return (
    <>
      <Helmet><title>Verify Email — Janelux Beads</title></Helmet>
      <AuthShell title="Verify Email" subtitle="One More Step">
        <p className="text-cream/50 text-sm text-center mb-8">
          We sent a 6-digit code to <strong className="text-gold">{form.email}</strong>
        </p>
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex gap-2 justify-center">
            {otp.map((val, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                value={val}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-bold text-cream bg-obsidian border border-obsidian-border focus:border-gold focus:outline-none transition-colors"
                maxLength={1}
              />
            ))}
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-50">
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <div className="text-center mt-6">
          <button onClick={resendOtp} disabled={resending} className="text-gold/60 hover:text-gold text-xs transition-colors disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </div>
      </AuthShell>
    </>
  );

  return (
    <>
      <Helmet><title>Create Account — Janelux Beads</title></Helmet>
      <AuthShell title="Create Account" subtitle="Join the Family">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="section-label text-[10px]">Full Name *</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="input-dark" placeholder="Esther Sobs" required />
          </div>
          <div>
            <label className="section-label text-[10px]">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-dark" placeholder="you@example.com" required />
          </div>
          <div>
            <label className="section-label text-[10px]">Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-dark" placeholder="080XXXXXXXX" />
          </div>
          <div>
            <label className="section-label text-[10px]">Password * (min. 8 characters)</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-dark" placeholder="••••••••" minLength={8} required />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full mt-2 disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-cream/40 text-xs mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gold hover:text-gold-light transition-colors">Sign in</Link>
        </p>
      </AuthShell>
    </>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>Forgot Password — Janelux Beads</title></Helmet>
      <AuthShell title="Reset Password" subtitle="Forgot Password">
        {sent ? (
          <div className="text-center">
            <Icons.Mail size={48} className="text-gold/40 mx-auto mb-4" />
            <p className="text-cream/60 text-sm mb-6">If an account exists for <strong className="text-gold">{email}</strong>, a reset link has been sent.</p>
            <Link to="/login" className="btn-outline">Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handle} className="space-y-4">
            <p className="text-cream/50 text-sm text-center mb-4">Enter your email and we'll send you a reset link.</p>
            <div>
              <label className="section-label text-[10px]">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark" placeholder="you@example.com" required />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link to="/login" className="block text-center text-cream/40 hover:text-gold text-xs transition-colors mt-2">
              Back to Sign In
            </Link>
          </form>
        )}
      </AuthShell>
    </>
  );
}

// ─── Reset Password ───────────────────────────────────────────────
export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token');

  const handle = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>New Password — Janelux Beads</title></Helmet>
      <AuthShell title="New Password" subtitle="Reset Password">
        {done ? (
          <div className="text-center">
            <Icons.Check size={48} className="text-gold mx-auto mb-4" />
            <p className="text-cream/60 text-sm">Password reset! Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="section-label text-[10px]">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" placeholder="Min. 8 characters" minLength={8} required />
            </div>
            <div>
              <label className="section-label text-[10px]">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-dark" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-50">
              {loading ? 'Resetting...' : 'Set New Password'}
            </button>
          </form>
        )}
      </AuthShell>
    </>
  );
}

export default LoginPage;
