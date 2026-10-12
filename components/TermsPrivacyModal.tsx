'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface TermsPrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgree: () => void;
}

export function TermsPrivacyModal({
  open,
  onOpenChange,
  onAgree,
}: TermsPrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            Terms of Service &amp; Privacy Policy
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-1 space-y-5 text-sm text-gray-600 leading-relaxed">
          <div>
            <p className="font-bold text-gray-800 mb-1">Terms of Service</p>
            <p>
              By using the Sto. Niño de Praga Academy portal, you agree to use
              the system only for lawful, school-related purposes. Accounts
              are personal and non-transferable. Misuse, unauthorized access,
              or sharing of credentials may result in account suspension.
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">Privacy Policy</p>
            <p>
              We collect personal information (name, contact details, grades,
              attendance) solely to manage enrollment and school operations,
              in compliance with the{' '}
              <strong>Data Privacy Act of 2012 (RA 10173)</strong>. Your data
              will not be sold or shared with third parties outside of
              authorized school personnel and required government agencies.
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">Data You Provide</p>
            <ul className="list-disc pl-4 space-y-1 text-gray-500">
              <li>Student name, grade level, and contact information</li>
              <li>Guardian name and email address</li>
              <li>Previous school details submitted in this inquiry</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">Your Rights</p>
            <p>
              You may request access, correction, or deletion of your data by
              contacting us at{' '}
              <span className="text-red-700">info@stnino.ph</span>. For the
              full policies, see{' '}
              <Link
                href="/terms"
                target="_blank"
                className="text-red-700 hover:underline"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="text-red-700 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onAgree}
            className="flex-1 h-10 rounded-lg bg-red-900 hover:bg-red-800 text-white text-sm font-semibold transition-colors"
          >
            I Agree
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
