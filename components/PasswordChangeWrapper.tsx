'use client';

import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PasswordChangeWrapperProps {
  userId: string;
  children: React.ReactNode;
}

export function PasswordChangeWrapper({
  userId,
  children,
}: PasswordChangeWrapperProps) {
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (!userId) {
        setIsChecking(false);
        return;
      }

      // Fast-path: if the stored user object already says false, no API call needed
      for (const key of ['teacher', 'student', 'parent', 'admin']) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
          const data = JSON.parse(raw);
          if (String(data.id) === userId && data.password_change_required === false) {
            setIsChecking(false);
            return;
          }
        } catch {}
      }

      // Snoozed for this session (user dismissed without changing)
      if (sessionStorage.getItem(`pwd_snoozed_${userId}`) === 'true') {
        setIsChecking(false);
        return;
      }

      // Check the DB
      try {
        const res = await fetch(`/api/auth/change-password?userId=${userId}`);
        const result = await res.json();
        if (result.success) {
          setPasswordChangeRequired(result.passwordChangeRequired);
          if (result.passwordChangeRequired) setShowModal(true);
        }
      } catch (e) {
        console.error('[PasswordChangeWrapper] Error:', e);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, [userId]);

  const handlePasswordChanged = () => {
    setPasswordChangeRequired(false);
    setShowModal(false);
    setShowBanner(false);
    // Update the stored user object so the fast-path skips the check on next mount
    for (const key of ['teacher', 'student', 'parent', 'admin']) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        if (String(data.id) === userId) {
          localStorage.setItem(key, JSON.stringify({ ...data, password_change_required: false }));
        }
      } catch {}
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (passwordChangeRequired) {
      sessionStorage.setItem(`pwd_snoozed_${userId}`, 'true');
      setShowBanner(true);
    }
  };

  if (isChecking) return <>{children}</>;

  return (
    <>
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-sm md:text-base">
                    Password Change Required
                  </p>
                  <p className="text-xs md:text-sm opacity-90">
                    For security purposes, you must change your password. This
                    is required for admin-created accounts.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => { setShowBanner(false); setShowModal(true); }}
                  size="sm"
                  className="bg-white text-amber-600 hover:bg-gray-100 font-semibold"
                >
                  Change Password
                </Button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="text-white hover:bg-amber-700 rounded p-1"
                  aria-label="Dismiss"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBanner && <div className="h-[76px] md:h-[68px]" />}
      {children}
      <ChangePasswordModal
        isOpen={showModal}
        userId={userId}
        onPasswordChanged={handlePasswordChanged}
        onClose={handleCloseModal}
      />
    </>
  );
}
