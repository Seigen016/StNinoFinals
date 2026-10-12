'use client';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  CreditCard,
  GraduationCap,
  Hash,
  Layers,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStudentAuth } from '../hooks/useStudentAuth';

export default function ProfilePage() {
  const { student, setStudent, isLoading } = useStudentAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledGradeLevel, setEnrolledGradeLevel] = useState<string | null>(
    null
  );
  const [enrolledSection, setEnrolledSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // DB column is photo_url; profile_picture is the legacy client-side key
    if (student?.photo_url) setAvatarUrl(student.photo_url);
    else if ((student as any)?.profile_picture)
      setAvatarUrl((student as any).profile_picture);
  }, [student?.photo_url, (student as any)?.profile_picture]);

  useEffect(() => {
    if (!student?.id) return;
    fetch(`/api/student/enrollment?studentId=${student.id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setIsEnrolled(res.data?.enrollment?.isEnrolled ?? false);
          setEnrolledGradeLevel(res.data?.student?.gradeLevel ?? null);
          setEnrolledSection(res.data?.student?.section ?? null);
        }
      })
      .catch(() => {});
  }, [student?.id]);
  const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    phone_number: '',
    guardian_phone: '',
    date_of_birth: '',
    address: '',
    current_address: '',
  });

  const displayName = useMemo(() => {
    if (!student) return 'Student';
    if (student.first_name && student.last_name) {
      return [
        student.first_name,
        student.middle_name,
        student.last_name,
        (student as any).suffix,
      ]
        .filter(Boolean)
        .join(' ');
    }
    return student.email?.split('@')[0] || 'Student';
  }, [student]);

  const avatarLetters = useMemo(
    () =>
      displayName
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [displayName]
  );

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    setUploadingAvatar(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userId', String(student.id));
      fd.append('role', 'student');

      const uploadRes = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);
      const url = uploadData.url;

      const res = await fetch('/api/student/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, profile_picture: url }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setAvatarUrl(url);
      const stored = localStorage.getItem('student');
      if (stored) {
        localStorage.setItem(
          'student',
          JSON.stringify({ ...JSON.parse(stored), photo_url: url })
        );
      }
    } catch (e: any) {
      setError(e.message || 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEdit = () => {
    if (!student) return;
    setForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      middle_name: student.middle_name || '',
      suffix: (student as any).suffix || '',
      phone_number:
        student.phone_number || student.phone || student.contact_number || '',
      guardian_phone: student.guardian_phone || '',
      date_of_birth: student.date_of_birth || '',
      address: student.address || '',
      current_address: student.current_address || '',
    });
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (!student) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/student/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, ...form }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save.');

      // Sync photo_url from DB response if returned; otherwise mirror from form
      const updated = {
        ...student,
        ...form,
        photo_url: result.student?.photo_url ?? student.photo_url,
      };
      setStudent(updated);
      localStorage.setItem('student', JSON.stringify(updated));
      setEditing(false);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  if (!student) return null;

  const normalizeGradeLevel = (gl: string | null | undefined): string => {
    if (!gl) return '';
    const s = gl.trim();
    // "grade6" → "Grade 6", "grade11" → "Grade 11"
    if (/^grade\d+$/i.test(s)) return `Grade ${s.replace(/^grade/i, '')}`;
    // "kinder" / "kindergarten" → "Kinder"
    if (/^kinder/i.test(s)) return 'Kinder';
    return s;
  };

  const gradeSection = isEnrolled
    ? [normalizeGradeLevel(enrolledGradeLevel), enrolledSection]
        .filter(Boolean)
        .join(' — ')
    : '';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Avatar + Name */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-blue-700/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-blue-700">
                  {avatarLetters}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-5 h-5 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition"
              title="Change photo"
            >
              {uploadingAvatar ? (
                <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 capitalize">
              {displayName.toLowerCase()}
            </h2>
            {(student.student_id || student.student_number) && (
              <p className="text-sm text-gray-400 mt-0.5">
                #{student.student_id || student.student_number}
              </p>
            )}
            {gradeSection && (
              <span className="inline-flex items-center mt-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                {gradeSection}
              </span>
            )}
          </div>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">
            Personal Information
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Your student profile and contact details
          </p>
        </div>

        {editing ? (
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>First Name</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label required>Last Name</Label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                  />
                  <Select
                    value={form.suffix || 'none'}
                    onValueChange={(v) =>
                      setForm({ ...form, suffix: v === 'none' ? '' : v })
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Sfx" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {SUFFIX_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input
                value={form.middle_name}
                onChange={(e) =>
                  setForm({ ...form, middle_name: e.target.value })
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                  +63
                </span>
                <Input
                  className="rounded-l-none"
                  value={form.phone_number
                    .replace(/^\+63/, '')
                    .replace(/^0/, '')}
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
              <Label>Guardian's Phone Number</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                  +63
                </span>
                <Input
                  className="rounded-l-none"
                  value={form.guardian_phone
                    .replace(/^\+63/, '')
                    .replace(/^0/, '')}
                  placeholder="9XXXXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, '');
                    setForm({ ...form, guardian_phone: d ? `+63${d}` : '' });
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Date of Birth</Label>
              <DatePicker
                value={form.date_of_birth}
                onChange={(v) => setForm({ ...form, date_of_birth: v })}
                placeholder="Select date of birth"
              />
            </div>
            <div>
              <Label>Permanent Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, Barangay, City"
              />
            </div>
            <div>
              <Label>Mailing Address</Label>
              <Input
                value={form.current_address}
                onChange={(e) =>
                  setForm({ ...form, current_address: e.target.value })
                }
                placeholder="Leave blank if same as permanent address"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-5 divide-y divide-gray-100">
            {[
              { icon: User, label: 'Full Name', value: displayName },
              {
                icon: Hash,
                label: 'Student No.',
                value: (student as any).student_number,
              },
              { icon: CreditCard, label: 'LRN', value: (student as any).lrn },
              {
                icon: GraduationCap,
                label: 'Grade Level',
                value: isEnrolled
                  ? normalizeGradeLevel(enrolledGradeLevel)
                  : null,
              },
              {
                icon: Layers,
                label: 'Section',
                value: isEnrolled ? enrolledSection : null,
              },
              { icon: Mail, label: 'Email', value: student.email },
              {
                icon: Phone,
                label: 'Contact Number',
                value:
                  student.phone_number ||
                  (student as any).phone ||
                  (student as any).contact_number,
              },
              {
                icon: Phone,
                label: "Guardian's Phone",
                value: student.guardian_phone,
              },
              {
                icon: MapPin,
                label: 'Permanent Address',
                value: student.address,
              },
              {
                icon: MapPin,
                label: 'Mailing Address',
                value: student.current_address,
              },
            ].map(({ icon: Icon, label, value }) =>
              value ? (
                <div key={label} className="flex items-start gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {value}
                    </p>
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
