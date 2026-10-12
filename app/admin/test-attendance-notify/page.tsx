'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Mail, Phone, Send, XCircle } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'email' | 'sms' | 'both';
  status: 'success' | 'partial' | 'error';
  detail: string;
}

export default function TestAttendanceNotifyPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentName, setStudentName] = useState('Juan Dela Cruz');
  const [gradeLevel, setGradeLevel] = useState('Grade 7');
  const [section, setSection] = useState('Section A');
  const [scanType, setScanType] = useState<'timein' | 'timeout'>('timein');
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  const handleSend = async () => {
    if (!email.trim() && !phone.trim()) return;

    setSending(true);
    const timestamp = new Date().toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
    });

    try {
      const res = await fetch('/api/admin/test-attendance-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          studentName,
          gradeLevel,
          section,
          scanType,
        }),
      });

      const data = await res.json();

      const emailResult = data.results?.email || '';
      const smsResult = data.results?.sms || '';

      let status: 'success' | 'partial' | 'error' = 'success';
      if (emailResult.startsWith('failed') && smsResult.startsWith('failed')) status = 'error';
      else if (emailResult.startsWith('failed') || smsResult.startsWith('failed')) status = 'partial';
      else if (!data.success) status = 'error';

      const details: string[] = [];
      if (emailResult) details.push(`Email: ${emailResult}`);
      if (smsResult) details.push(`SMS: ${smsResult}`);
      if (!data.success) details.push(data.error || 'Unknown error');

      setLog((prev) => [
        {
          id: nextId,
          timestamp,
          type: email && phone ? 'both' : email ? 'email' : 'sms',
          status,
          detail: details.join(' | '),
        },
        ...prev,
      ]);
      setNextId((n) => n + 1);
    } catch (err: any) {
      setLog((prev) => [
        {
          id: nextId,
          timestamp,
          type: 'email',
          status: 'error',
          detail: err?.message || 'Network error',
        },
        ...prev,
      ]);
      setNextId((n) => n + 1);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Test Attendance Notification
          </h2>
          <p className="text-gray-600">
            Simulate an RFID scan and send email/SMS notifications to verify
            they work.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-800">Notification Settings</CardTitle>
            <CardDescription>
              Enter your email and/or phone to receive a test attendance alert.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone (optional)
                </Label>
                <Input
                  id="phone"
                  placeholder="09171234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Grade Level</Label>
                <Input
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </div>
            </div>

            {/* Scan Type */}
            <div className="space-y-2">
              <Label>Scan Type</Label>
              <Select
                value={scanType}
                onValueChange={(v) => setScanType(v as 'timein' | 'timeout')}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timein">Time In</SelectItem>
                  <SelectItem value="timeout">Time Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-red-800 hover:bg-red-700"
              onClick={handleSend}
              disabled={sending || (!email.trim() && !phone.trim())}
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send Test Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Log */}
        {log.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-800">Send Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {log.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {entry.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : entry.status === 'partial' ? (
                      <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={
                            entry.status === 'success'
                              ? 'bg-green-50 text-green-700 border-green-300'
                              : entry.status === 'partial'
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                : 'bg-red-50 text-red-700 border-red-300'
                          }
                        >
                          {entry.status}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 break-all">
                        {entry.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
