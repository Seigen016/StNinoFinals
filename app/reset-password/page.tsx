'use client';

import { supabase } from '@/lib/supabaseClient';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  // Listen for Supabase auth events (the recovery token comes via URL hash)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if there's already a session from the recovery link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    // If no session after 5 seconds, show error
    const timeout = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) setSessionError(true);
        return ready;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const validatePassword = (value: string) => {
    if (!value) return '';
    if (value.length < 6) return 'Must be at least 6 characters';
    if (!/^[a-zA-Z0-9]+$/.test(value)) return 'Letters and numbers only (no special characters)';
    if (!/[a-zA-Z]/.test(value)) return 'Must contain at least one letter';
    if (!/[0-9]/.test(value)) return 'Must contain at least one number';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwErr = validatePassword(newPassword);
    if (pwErr) { setError(pwErr); return; }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to reset password.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="School Logo"
              width={60}
              height={60}
              className="rounded-full"
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Reset Password
          </h1>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <p className="text-gray-600">
                Your password has been reset successfully.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-red-900 hover:bg-red-800 px-6 py-2.5 rounded-lg transition-colors"
              >
                Go to Login
              </Link>
            </div>
          ) : sessionError ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="w-16 h-16 text-red-500" />
              </div>
              <p className="text-gray-600">
                This reset link is invalid or has expired. Please request a new
                one.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-sm text-red-800 hover:underline mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Request new reset link
              </Link>
            </div>
          ) : !sessionReady ? (
            <div className="flex flex-col items-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-800 border-t-transparent mb-4" />
              <p className="text-gray-500 text-sm">
                Verifying your reset link...
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 text-center text-sm mb-6">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setNewPasswordError(validatePassword(e.target.value));
                        if (confirmPassword)
                          setConfirmPasswordError(e.target.value !== confirmPassword ? 'Passwords do not match' : '');
                      }}
                      placeholder="Enter new password"
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent ${newPasswordError ? 'border-red-500' : 'border-gray-300'}`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {newPasswordError && (
                    <p className="text-red-500 text-xs mt-1">{newPasswordError}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmPasswordError(e.target.value !== newPassword ? 'Passwords do not match' : '');
                      }}
                      placeholder="Confirm new password"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent ${confirmPasswordError ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {confirmPasswordError && (
                    <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
                  )}
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Password must be at least 6 characters, alphanumeric only (letters and numbers)
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!newPassword || !confirmPassword || !!newPasswordError || !!confirmPasswordError || loading}
                  className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all duration-200 bg-red-900 hover:bg-red-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-red-800 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
