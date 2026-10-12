'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAlert } from '@/lib/use-alert';
import { AlertTriangle, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  userId: string;
  onPasswordChanged: () => void;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  userId,
  onPasswordChanged,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { showAlert } = useAlert();

  const validateNewPassword = (value: string) => {
    if (!value) return '';
    if (value.length < 6) return 'Must be at least 6 characters';
    if (!/^[a-zA-Z0-9]+$/.test(value)) return 'Letters and numbers only (no special characters)';
    if (!/[a-zA-Z]/.test(value)) return 'Must contain at least one letter';
    if (!/[0-9]/.test(value)) return 'Must contain at least one number';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
      setError('Password must contain only letters and numbers (alphanumeric)');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one letter and one number');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showAlert({
          message: 'Password changed successfully!',
          type: 'success',
        });
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Notify parent component
        onPasswordChanged();
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-amber-600">
              Password Change Required
            </DialogTitle>
          </div>
          <DialogDescription>
            For security purposes, you must change your password before
            accessing the system. This is required for all accounts created by
            administrators.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="currentPassword" required>Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                placeholder="Enter current password"
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword" required>New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                placeholder="Enter new password (min. 6 characters)"
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setNewPasswordError(validateNewPassword(e.target.value));
                  if (confirmPassword) {
                    setConfirmPasswordError(e.target.value !== confirmPassword ? 'Passwords do not match' : '');
                  }
                }}
                required
                minLength={6}
                disabled={isSubmitting}
                className={`pr-10 ${newPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                {showNewPassword ? (
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
            <Label htmlFor="confirmPassword" required>Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                placeholder="Re-enter new password"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError(e.target.value !== newPassword ? 'Passwords do not match' : '');
                }}
                required
                disabled={isSubmitting}
                className={`pr-10 ${confirmPasswordError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800">
              <Lock className="h-4 w-4 inline mr-1" />
              Password must be at least 6 characters, alphanumeric only (letters and numbers)
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-red-800 hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
