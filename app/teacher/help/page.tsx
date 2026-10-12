'use client';

import { HelpCircle, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

const FAQS = [
  {
    q: 'How do I submit grades for my class?',
    a: 'Go to Manage Grades, select a class and subject, then enter each student\'s grade and click Submit Grades. Submissions go to the admin for approval before they become final.',
  },
  {
    q: 'Can I bulk-import grades instead of typing them one by one?',
    a: 'Yes — on the Manage Grades page, use the Import CSV button next to Export. The file should have a student number in the first column and the grade in the second. You\'ll be able to review matched, unmatched, and out-of-range rows before submitting.',
  },
  {
    q: 'A grade I submitted was rejected. What do I do?',
    a: 'You\'ll receive an email with the admin\'s reason for the rejection. Go back to Manage Grades, correct the value, and resubmit — it will go through review again.',
  },
  {
    q: 'How do I take attendance for my class?',
    a: 'Go to Attendance in the sidebar to view and record attendance for your assigned classes.',
  },
  {
    q: 'The grading period is locked and I can\'t submit. Why?',
    a: 'Admins can close grading for a quarter once it ends. Contact the school administration below if you believe this is a mistake or need a late submission.',
  },
];

export default function TeacherHelpPage() {
  const [contact, setContact] = useState({ phone: '', contactEmail: '', address: '', officeHours: '' });

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings) {
          setContact({
            phone: d.settings.phone || '',
            contactEmail: d.settings.contactEmail || '',
            address: d.settings.address || '',
            officeHours: d.settings.officeHours || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-gray-400" />
          Help & Support
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Answers to common questions about using the teacher portal.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {FAQS.map((item) => (
          <details key={item.q} className="group px-5 py-4">
            <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-900 list-none">
              {item.q}
              <span className="text-gray-300 group-open:rotate-180 transition-transform duration-150 ease-out">▾</span>
            </summary>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Still need help?</p>
        <div className="space-y-2 text-sm text-gray-600">
          {contact.contactEmail && (
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <a href={`mailto:${contact.contactEmail}`} className="text-blue-600 hover:underline">{contact.contactEmail}</a>
            </p>
          )}
          {contact.phone && (
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a>
            </p>
          )}
          {contact.address && (
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              {contact.address}
            </p>
          )}
          {contact.officeHours && (
            <p className="text-xs text-gray-400 pl-6">{contact.officeHours}</p>
          )}
        </div>
      </div>
    </div>
  );
}
