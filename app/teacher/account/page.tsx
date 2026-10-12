'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, Camera, Hash, Mail, MapPin, Phone, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { DatePicker } from '@/components/ui/date-picker';
import { useAlert } from '@/lib/use-alert';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Teacher {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
  employee_number?: string;
  teacher_id?: string;
  department?: string;
  specialization?: string;
  phone_number?: string;
  phone?: string;
  contact_number?: string;
  address?: string;
  date_of_birth?: string;
  photo_url?: string;
  [key: string]: any;
}

export default function TeacherAccount() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    phone_number: '',
    address: '',
    date_of_birth: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('teacher');
    if (!stored) { router.push('/login?role=teacher'); return; }
    try {
      const parsed = JSON.parse(stored);
      setTeacher(parsed);
      if (parsed.photo_url) setAvatarUrl(parsed.photo_url);
    } catch {
      localStorage.removeItem('teacher');
      router.push('/login?role=teacher');
    }
  }, [router]);

  const displayName = useMemo(() => {
    if (!teacher) return 'Teacher';
    if (teacher.first_name && teacher.last_name) {
      return [teacher.first_name, teacher.middle_name, teacher.last_name, teacher.suffix]
        .filter(Boolean).join(' ');
    }
    return teacher.name || teacher.email?.split('@')[0] || 'Teacher';
  }, [teacher]);

  const avatarLetters = displayName
    .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacher) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userId', String(teacher.id));
      fd.append('role', 'teacher');

      const uploadRes = await fetch('/api/upload-avatar', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error || 'Upload failed');
      const url = uploadData.url;

      const res = await fetch('/api/teacher/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: String(teacher.id), photo_url: url }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save photo');

      // Only update UI state after both upload AND profile save succeed
      setAvatarUrl(url);
      const stored = localStorage.getItem('teacher');
      if (stored) {
        localStorage.setItem('teacher', JSON.stringify({ ...JSON.parse(stored), photo_url: url }));
      }
      showAlert({ message: 'Profile photo updated.', type: 'success' });
    } catch (e: any) {
      showAlert({ message: e.message || 'Failed to upload photo.', type: 'error' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEdit = () => {
    if (!teacher) return;
    setForm({
      first_name:    teacher.first_name  || '',
      last_name:     teacher.last_name   || '',
      middle_name:   teacher.middle_name || '',
      suffix:        teacher.suffix || '',
      phone_number:  teacher.phone_number || teacher.phone || teacher.contact_number || '',
      address:       teacher.address     || '',
      date_of_birth: teacher.date_of_birth || '',
    });
    setError('');
    setEditing(true);
  };

  const handleCancel = () => { setEditing(false); setError(''); };

  const handleSave = async () => {
    if (!teacher) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: teacher.id, ...form }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save.');

      const updated = { ...teacher, ...form };
      setTeacher(updated);
      localStorage.setItem('teacher', JSON.stringify(updated));
      setEditing(false);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (!teacher) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Avatar + Name */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-amber-700/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-amber-700">{avatarLetters}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-5 h-5 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition"
              title="Change photo"
            >
              {uploadingAvatar
                ? <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-3 h-3 text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 capitalize">{displayName.toLowerCase()}</h2>
            {(teacher.employee_number || teacher.teacher_id) && (
              <p className="text-sm text-gray-400 mt-0.5">#{teacher.employee_number || teacher.teacher_id}</p>
            )}
            {teacher.department && (
              <span className="inline-flex items-center mt-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {teacher.department}
              </span>
            )}
          </div>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>Edit Profile</Button>
        )}
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Personal Information</p>
        </div>

        {editing ? (
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label required>Last Name</Label>
                <div className="flex gap-2">
                  <Input className="flex-1" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  <Select
                    value={form.suffix || 'none'}
                    onValueChange={(v) => setForm({ ...form, suffix: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Sfx" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {SUFFIX_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} placeholder="Optional" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">+63</span>
                <Input
                  className="rounded-l-none"
                  value={form.phone_number.replace(/^\+63/, '').replace(/^0/, '')}
                  placeholder="9XXXXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, phone_number: d ? `+63${d}` : '' });
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Date of Birth</Label>
              <DatePicker value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} placeholder="Select date of birth" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, Barangay, City" />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-5 divide-y divide-gray-100">
            {[
              { icon: User,   label: 'Full Name',    value: displayName },
              { icon: Hash,   label: 'Employee No.', value: teacher.employee_number || teacher.teacher_id },
              { icon: Mail,   label: 'Email',        value: teacher.email },
              { icon: Phone,  label: 'Contact',      value: teacher.phone_number || teacher.phone || teacher.contact_number },
              { icon: MapPin, label: 'Address',      value: teacher.address },
            ].map(({ icon: Icon, label, value }) =>
              value ? (
                <div key={label} className="flex items-start gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Teaching Info — always read-only */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Teaching Information</p>
        </div>
        <div className="px-5 divide-y divide-gray-100">
          {[
            { icon: BookOpen, label: 'Department',     value: teacher.department },
            { icon: Hash,     label: 'Specialization', value: teacher.specialization },
          ].map(({ icon: Icon, label, value }) =>
            value ? (
              <div key={label} className="flex items-start gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
