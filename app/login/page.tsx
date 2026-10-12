'use client';

import { TermsPrivacyModal } from '@/components/TermsPrivacyModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const searchParams = useSearchParams();

  // Auto-fill email and password from URL params (from welcome email link)
  useEffect(() => {
    const paramEmail = searchParams.get('email');
    const paramPassword = searchParams.get('password');
    if (paramEmail) setEmail(paramEmail);
    if (paramPassword) setPassword(paramPassword);
  }, [searchParams]);

  // Redirect already-logged-in users
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('student')) {
      router.replace('/student');
    } else if (localStorage.getItem('teacher')) {
      router.replace('/teacher');
    } else if (localStorage.getItem('admin')) {
      router.replace('/admin');
    } else if (localStorage.getItem('parent')) {
      router.replace('/parent-dashboard');
    }
  }, [router]);

  const emailError = useMemo(() => {
    if (!email) return 'Email is required.';
    return EMAIL_REGEX.test(email.trim())
      ? null
      : 'Enter a valid email address.';
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return 'Password is required.';
    return password.length >= 6
      ? null
      : 'Password must be at least 6 characters.';
  }, [password]);

  const loginDisabled =
    isLoggingIn ||
    !email ||
    !password ||
    Boolean(emailError || passwordError) ||
    !agreeTerms;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);

    if (emailError || passwordError) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Detect role from email
      const detectRes = await fetch('/api/auth/detect-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const { role } = await detectRes.json();

      if (!role) {
        setError('No account found with this email address.');
        return;
      }

      if (role === 'student') {
        const res = await fetch('/api/student/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Invalid email or password.');
          return;
        }
        localStorage.setItem('student', JSON.stringify(data.student));
        router.push(data.firstLogin ? '/student?firstLogin=true' : '/student');
      } else if (role === 'teacher') {
        const res = await fetch('/api/teacher/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Invalid email or password.');
          return;
        }
        localStorage.setItem('teacher', JSON.stringify(data.teacher));
        router.push('/teacher');
      } else if (role === 'parent' || role === 'admin') {
        const { data: authData, error: authError } =
          await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

        if (authError || !authData.user) {
          setError(authError?.message || 'Invalid email or password.');
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .ilike('email', trimmedEmail)
          .eq('role', role)
          .single();

        if (profileError || !userProfile) {
          await supabase.auth.signOut();
          setError('Account not found. Please contact support.');
          return;
        }

        if (role === 'admin') {
          localStorage.setItem('admin', JSON.stringify(userProfile));
          router.push('/admin');
        } else {
          localStorage.setItem('parent', JSON.stringify(userProfile));

          const { data: relationships } = await supabase
            .from('user_relationships')
            .select(
              'related_user_id, users!user_relationships_related_user_id_fkey(*)'
            )
            .eq('user_id', userProfile.id)
            .eq('users.role', 'student');

          if (relationships) {
            const children = relationships
              .map((rel: any) => rel.users)
              .filter(Boolean);
            localStorage.setItem('parentChildren', JSON.stringify(children));
          }

          router.push('/parent-dashboard');
        }
      } else {
        setError('Unknown account type. Please contact support.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg = err?.message || String(err) || '';
      if (
        msg.toLowerCase().includes('network') ||
        msg.includes('Failed to fetch')
      ) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(msg || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Loading overlay */}
      {isLoggingIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center shadow-2xl">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-full border-4 border-red-100 border-t-red-800 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-full opacity-60"
                />
              </div>
            </div>
            <p className="text-gray-800 font-semibold text-lg">
              Signing you in
            </p>
            <p className="text-gray-400 text-sm mt-1">Just a moment…</p>
          </div>
        </div>
      )}

      {/* ── Left hero panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-rose-800">
        {/* Decorative blurred orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute -bottom-24 left-16 w-72 h-72 rounded-full bg-rose-400/10 blur-3xl" />

        {/* Decorative dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Top logo */}
        <div className="relative z-10 p-10">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
            aria-label="Sto Niño de Praga Academy Home"
          >
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Sto Niño de Praga Academy Logo"
                width={44}
                height={44}
                className="rounded-full ring-2 ring-white/20"
              />
              <span className="text-white/90 font-semibold text-sm leading-tight">
                Sto. Niño de Praga
                <br />
                <span className="text-white/60 font-normal">Academy</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 px-12 pb-12">
          <div className="mb-8">
            <span className="inline-block bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
              School Portal
            </span>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Empowering
              <br />
              <span className="text-amber-300">minds,</span> building
              <br />
              futures.
            </h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              Your all-in-one portal for grades, attendance, schedules, and
              everything your school journey needs.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              'Grades & Records',
              'Live Attendance',
              'Enrollment',
              'Reports',
            ].map((f) => (
              <span
                key={f}
                className="bg-white/10 hover:bg-white/15 transition-colors text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/10"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="relative z-10 px-12 py-5 border-t border-white/10">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Sto. Niño de Praga Academy · All rights
            reserved
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-6 pt-8 pb-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="text-red-900 font-semibold text-sm">
            Sto. Niño de Praga Academy
          </span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-12">
          <div className="w-full max-w-sm">
            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-500 text-sm">
                Sign in to continue to your portal
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              {/* Email field */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="login-email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    aria-invalid={emailTouched && Boolean(emailError)}
                    aria-describedby="login-email-error"
                    autoComplete="email"
                    required
                    disabled={isLoggingIn}
                    className={`pl-10 h-11 bg-gray-50 border transition-colors focus:bg-white ${
                      emailTouched && emailError
                        ? 'border-red-400 focus-visible:ring-red-400'
                        : 'border-gray-200 focus-visible:ring-red-800/30'
                    }`}
                  />
                </div>
                {emailTouched && emailError && (
                  <p
                    id="login-email-error"
                    className="text-xs text-red-600 mt-1"
                  >
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="login-password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    aria-invalid={passwordTouched && Boolean(passwordError)}
                    aria-describedby="login-password-error"
                    autoComplete="current-password"
                    required
                    disabled={isLoggingIn}
                    className={`pl-10 pr-10 h-11 bg-gray-50 border transition-colors focus:bg-white ${
                      passwordTouched && passwordError
                        ? 'border-red-400 focus-visible:ring-red-400'
                        : 'border-gray-200 focus-visible:ring-red-800/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordTouched && passwordError && (
                  <p
                    id="login-password-error"
                    className="text-xs text-red-600 mt-1"
                  >
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Error banner */}
              {error && (
                <div
                  className="flex items-start gap-2.5 text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p aria-live="assertive">{error}</p>
                </div>
              )}

              {/* Terms agreement */}
              <div className="flex items-start gap-3">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  checked={agreeTerms}
                  onClick={(e) => {
                    if (!agreeTerms) {
                      e.preventDefault();
                      setTermsModalOpen(true);
                    }
                  }}
                  onChange={(e) => {
                    if (!e.target.checked) setAgreeTerms(false);
                  }}
                  disabled={isLoggingIn}
                  className="mt-0.5 w-4 h-4 accent-red-800 cursor-pointer shrink-0"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-xs text-gray-500 cursor-pointer leading-relaxed select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!agreeTerms) {
                      setTermsModalOpen(true);
                    } else {
                      setAgreeTerms(false);
                    }
                  }}
                >
                  I agree to the{' '}
                  <span className="text-red-800">Terms of Service</span> and{' '}
                  <span className="text-red-800">Privacy Policy</span>.
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loginDisabled}
                className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all duration-200 bg-red-900 hover:bg-red-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 mt-1"
              >
                {isLoggingIn ? 'Signing in…' : 'Sign in'}
              </button>

              <div className="text-right mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-red-800 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </form>

            {/* Back link */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-red-800 transition-colors inline-flex items-center gap-1"
              >
                <span>←</span>
                <span>Back to home</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden px-6 py-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Sto. Niño de Praga Academy
          </p>
        </div>
      </div>

      <TermsPrivacyModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        onAgree={() => {
          setAgreeTerms(true);
          setTermsModalOpen(false);
        }}
      />
    </div>
  );
}
