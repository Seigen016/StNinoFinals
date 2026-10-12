'use client';

import { LegalContent } from '@/components/LegalContent';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TermsOfServicePage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings?.termsContent) setContent(d.settings.termsContent);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full ring-2 ring-red-100 w-10 h-10"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-red-900 leading-tight">
                  Sto. Niño de Praga Academy
                </p>
                <p className="text-xs text-gray-500">
                  Excellence in Education Since 1998
                </p>
              </div>
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-red-800 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="mb-10">
          <span className="text-xs font-bold tracking-widest uppercase text-red-700 mb-3 block">
            Legal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
            Terms of Service
          </h1>
        </div>

        <div className="prose prose-gray max-w-none text-gray-600 text-sm leading-relaxed">
          {content ? (
            <LegalContent text={content} />
          ) : (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Sto. Niño de Praga Academy
          </p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-xs text-red-700 font-medium">
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
