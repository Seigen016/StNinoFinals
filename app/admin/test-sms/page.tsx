'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, MessageSquare, RefreshCw, Send, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
  id: number;
  timestamp: string;
  phone: string;
  message: string;
  status: 'success' | 'error';
  detail: string;
}

const DEFAULT_MESSAGE =
  '[Sto Niño Portal] This is a test SMS. If you received this, SMS notifications are working correctly.';

export default function TestSmsPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  const charsLeft = 160 - message.length;

  const handleSend = async () => {
    if (!phone.trim() || !message.trim()) return;
    setSending(true);
    const timestamp = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
    try {
      const res = await fetch('/api/admin/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), message: message.trim() }),
      });
      const data = await res.json();
      setLog(prev => [{
        id: nextId,
        timestamp,
        phone: phone.trim(),
        message: message.trim(),
        status: data.success ? 'success' : 'error',
        detail: data.success
          ? `Sent successfully${data.messageId ? ` · ID: ${data.messageId}` : ''}`
          : data.error || 'Unknown error',
      }, ...prev]);
      setNextId(n => n + 1);
    } catch (err: any) {
      setLog(prev => [{
        id: nextId,
        timestamp,
        phone: phone.trim(),
        message: message.trim(),
        status: 'error',
        detail: err?.message || 'Network error',
      }, ...prev]);
      setNextId(n => n + 1);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          SMS Tester
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Send test messages via TextBee without needing an RFID scan
        </p>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Compose Test SMS</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Sends via <span className="font-medium text-gray-600">TextBee</span> using the device and API key configured in your environment.
          </p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recipient Phone Number
            </label>
            <input
              placeholder="09XXXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="block w-full max-w-xs px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white font-mono"
            />
            <p className="text-xs text-gray-400">
              PH numbers starting with 0 are auto-converted to +63.
            </p>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Message
              </label>
              <span className={`text-xs tabular-nums ${
                charsLeft < 0
                  ? 'text-red-500 font-semibold'
                  : charsLeft < 20
                    ? 'text-amber-600'
                    : 'text-gray-400'
              }`}>
                {charsLeft < 0
                  ? `${Math.abs(charsLeft)} over limit`
                  : `${charsLeft} chars left`}
              </span>
            </div>
            <Textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="resize-none font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={handleSend}
              disabled={sending || !phone.trim() || !message.trim() || charsLeft < 0}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {sending ? (
                <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Sending…</>
              ) : (
                <><Send className="w-3.5 h-3.5 mr-2" />Send Test SMS</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage(DEFAULT_MESSAGE)}
              disabled={sending || message === DEFAULT_MESSAGE}
            >
              Reset Message
            </Button>
          </div>
        </div>
      </div>

      {/* Send Log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Send Log</p>
            <p className="text-xs text-gray-400 mt-0.5">Results from this session</p>
          </div>
          {log.length > 0 && (
            <button
              onClick={() => setLog([])}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>

        {log.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No messages sent yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {log.map(entry => (
              <div key={entry.id} className="px-5 py-3.5 flex gap-3">
                <div className="mt-0.5 shrink-0">
                  {entry.status === 'success'
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 font-mono">{entry.phone}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      entry.status === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {entry.status === 'success' ? 'Sent' : 'Failed'}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">{entry.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{entry.message}</p>
                  <p className={`text-xs ${entry.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {entry.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
