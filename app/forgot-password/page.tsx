'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = EMAIL_REGEX.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Sto Niño de Praga Academy Logo"
              width={48}
              height={48}
              className="rounded-full ring-2 ring-red-100"
            />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-14 h-14 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                If an account exists with{' '}
                <span className="font-semibold text-gray-700">{email}</span>,
                a password reset link has been sent.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-red-800 hover:underline mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Forgot your password?
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter your email and we'll send you a link to reset it.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="forgot-email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      autoFocus
                      disabled={loading}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 transition-colors focus:bg-white focus-visible:ring-red-800/30"
                    />
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2.5 text-sm bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p aria-live="assertive">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isValidEmail || loading}
                  className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all duration-200 bg-red-900 hover:bg-red-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-red-800 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-red-800 transition-colors">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
