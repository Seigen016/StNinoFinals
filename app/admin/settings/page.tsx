'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, FileText, Mail, MapPin, MessageSquare, Phone, RefreshCw, Save, Settings as SettingsIcon, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemSettings {
  schoolName: string;
  academicYear: string;
  phone: string;
  contactEmail: string;
  address: string;
  officeHours: string;
  passingThreshold: number;
  footerTagline: string;
  termsContent: string;
  privacyContent: string;
}

type StringSettingKey =
  | 'schoolName'
  | 'phone'
  | 'contactEmail'
  | 'address'
  | 'officeHours'
  | 'footerTagline'
  | 'termsContent'
  | 'privacyContent';

function FeedbackLine({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600' : 'text-red-500'}`}>
      {ok
        ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        : <XCircle    className="w-3.5 h-3.5 shrink-0" />}
      {msg}
    </p>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    schoolName: 'Sto Niño de Praga Academy',
    academicYear: '2024-2025',
    phone: '',
    contactEmail: '',
    address: '',
    officeHours: '',
    passingThreshold: 75,
    footerTagline: '',
    termsContent: '',
    privacyContent: '',
  });
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saveFeedback, setSaveFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success && data.settings) setSettings(data.settings);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (field: StringSettingKey, value: string) =>
    setSettings(prev => ({ ...prev, [field]: value }));


  const handleSave = async () => {
    setSaving(true);
    setSaveFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      const ok = !!data.success;
      setSaveFeedback({ ok, msg: ok ? 'Settings saved successfully.' : 'Error saving settings. Please try again.' });
      if (ok) setTimeout(() => setSaveFeedback(null), 3000);
    } catch {
      setSaveFeedback({ ok: false, msg: 'Error saving settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testSmsPhone.trim()) return;
    setSendingSms(true);
    setSmsFeedback(null);
    try {
      const res = await fetch('/api/admin/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testSmsPhone.trim() }),
      });
      const data = await res.json();
      setSmsFeedback(data.success
        ? { ok: true,  msg: `Sent to ${data.sentTo}` }
        : { ok: false, msg: data.error || 'Failed to send SMS' });
    } catch (err: any) {
      setSmsFeedback({ ok: false, msg: err?.message || 'Network error' });
    } finally {
      setSendingSms(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress.trim()) return;
    setSendingEmail(true);
    setEmailFeedback(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmailAddress.trim() }),
      });
      const data = await res.json();
      setEmailFeedback(data.success
        ? { ok: true,  msg: `Email sent to ${testEmailAddress}` }
        : { ok: false, msg: data.error || 'Failed to send email' });
    } catch (err: any) {
      setEmailFeedback({ ok: false, msg: err?.message || 'Network error' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            System Settings
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Global preferences and integrations for your school system
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveFeedback && <FeedbackLine ok={saveFeedback.ok} msg={saveFeedback.msg} />}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white shrink-0"
          >
            {saving
              ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Saving…</>
              : <><Save className="w-3.5 h-3.5 mr-2" />Save Settings</>}
          </Button>
        </div>
      </div>

      {/* School Information */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">School Information</p>
          <p className="text-xs text-gray-400 mt-0.5">Basic school configuration settings</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-4">
          <div className="space-y-1.5">
            <label htmlFor="schoolName" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              School Name
            </label>
            <input
              id="schoolName"
              value={settings.schoolName}
              onChange={e => handleInputChange('schoolName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Academic Year
            </label>
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
              {settings.academicYear}
              <span className="ml-auto text-[10px] text-gray-400 font-medium uppercase tracking-wide">Auto-calculated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Contact Information</p>
          <p className="text-xs text-gray-400 mt-0.5">Displayed on the public landing page</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Phone className="w-3 h-3" /> Phone
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 select-none">+63</span>
              <input
                value={settings.phone.replace(/^\+63/, '').replace(/^0/, '')}
                onChange={e => {
                  const d = e.target.value.replace(/\D/g, '');
                  handleInputChange('phone', d ? `+63${d}` : '');
                }}
                placeholder="9XXXXXXXXX"
                inputMode="numeric"
                maxLength={10}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Mail className="w-3 h-3" /> Contact Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={e => handleInputChange('contactEmail', e.target.value)}
              placeholder="e.g. info@school.edu.ph"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <MapPin className="w-3 h-3" /> Address
            </label>
            <input
              value={settings.address}
              onChange={e => handleInputChange('address', e.target.value)}
              placeholder="e.g. 123 Education St, Manila"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Clock className="w-3 h-3" /> Office Hours
            </label>
            <input
              value={settings.officeHours}
              onChange={e => handleInputChange('officeHours', e.target.value)}
              placeholder="e.g. Mon–Fri, 7:00 AM – 5:00 PM"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Passing Grade Threshold
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.passingThreshold}
              onChange={e => setSettings(prev => ({ ...prev, passingThreshold: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
              placeholder="e.g. 75"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
            <p className="text-[11px] text-gray-400">Minimum grade (0–100) to mark a submission as Passed.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Footer Tagline
            </label>
            <input
              value={settings.footerTagline}
              onChange={e => handleInputChange('footerTagline', e.target.value)}
              placeholder="e.g. Excellence in Education Since 1998"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Legal Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            Legal Content
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Shown on the public Terms of Service and Privacy Policy pages. Plain text only — start a line with "## " for a section heading, or "- " for a bullet point.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 px-5 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Terms of Service
            </label>
            <Textarea
              value={settings.termsContent}
              onChange={e => handleInputChange('termsContent', e.target.value)}
              rows={10}
              className="font-mono text-xs resize-y"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Privacy Policy
            </label>
            <Textarea
              value={settings.privacyContent}
              onChange={e => handleInputChange('privacyContent', e.target.value)}
              rows={10}
              className="font-mono text-xs resize-y"
            />
          </div>
        </div>
      </div>

      {/* Test Notifications */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Test Notifications</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Verify SMS and email integrations are working without needing an RFID scan or user creation.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Test SMS */}
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">Test SMS <span className="text-xs font-normal text-gray-400 ml-1">via TextBee</span></p>
            </div>
            <p className="text-xs text-gray-400">
              Sends a test message to confirm the device is online and the API key is valid.
            </p>
            <div className="flex gap-2">
              <input
                placeholder="09XXXXXXXXX"
                value={testSmsPhone}
                onChange={e => { setTestSmsPhone(e.target.value); setSmsFeedback(null); }}
                onKeyDown={e => e.key === 'Enter' && handleTestSms()}
                className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white font-mono"
              />
              <Button
                onClick={handleTestSms}
                disabled={sendingSms || !testSmsPhone.trim()}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white shrink-0"
              >
                {sendingSms
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : 'Send'}
              </Button>
            </div>
            {smsFeedback && <FeedbackLine ok={smsFeedback.ok} msg={smsFeedback.msg} />}
          </div>

          {/* Test Email */}
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-900">Test Email <span className="text-xs font-normal text-gray-400 ml-1">via SMTP</span></p>
            </div>
            <p className="text-xs text-gray-400">
              Sends a test email via the configured Gmail SMTP account to confirm credentials and connectivity.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={e => { setTestEmailAddress(e.target.value); setEmailFeedback(null); }}
                onKeyDown={e => e.key === 'Enter' && handleTestEmail()}
                className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
              />
              <Button
                onClick={handleTestEmail}
                disabled={sendingEmail || !testEmailAddress.trim()}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white shrink-0"
              >
                {sendingEmail
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : 'Send'}
              </Button>
            </div>
            {emailFeedback && <FeedbackLine ok={emailFeedback.ok} msg={emailFeedback.msg} />}
          </div>
        </div>
      </div>
    </div>
  );
}
