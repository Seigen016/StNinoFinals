'use client';

import { HelpCircle, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';

const FAQS = [
  {
    q: 'How do I view my grades?',
    a: 'Go to Grades & Reports in the sidebar. You can filter by school year and quarter, and download a PDF or Excel copy of your report card from there.',
  },
  {
    q: 'How do I enroll for the next school year?',
    a: 'Go to Enrollment in the sidebar and submit a new enrollment request. You will be notified once the school reviews and approves it.',
  },
  {
    q: 'How do I update my profile or address?',
    a: 'Go to Profile in the sidebar. Some fields (like your student number or grade level) can only be changed by the school admin.',
  },
  {
    q: 'I forgot my password. What do I do?',
    a: 'Use the "Forgot Password" link on the login page, or contact the school administration below to have it reset.',
  },
  {
    q: 'Why is a grade showing as "Pending" or "Rejected"?',
    a: 'Grades submitted by teachers are reviewed by the school before they appear as final. A rejected grade means your teacher needs to review and resubmit it — this does not require any action from you.',
  },
];

export default function StudentHelpPage() {
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
          Answers to common questions about using the student portal.
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
