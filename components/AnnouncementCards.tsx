'use client';

import { Bell } from 'lucide-react';

export interface AnnouncementItem {
  id: string | number;
  title: string;
  content?: string;
  priority?: string;
  published_at?: string;
  date?: string;
  from?: string;
}

interface AnnouncementCardsProps {
  announcements: AnnouncementItem[];
  onSelect?: (a: AnnouncementItem) => void;
}

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // posted within the last 3 days counts as "new"

function formatDate(raw?: string) {
  if (!raw) return '';
  return new Date(raw).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isNew(raw?: string) {
  if (!raw) return false;
  return Date.now() - new Date(raw).getTime() < NEW_WINDOW_MS;
}

export function AnnouncementCards({ announcements, onSelect }: AnnouncementCardsProps) {
  if (!announcements || announcements.length === 0) return null;

  const sorted = [...announcements].sort(
    (a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0)
  );
  const newCount = sorted.filter((a) => isNew(a.published_at || a.date)).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-red-800" />
        <h3 className="font-bold text-gray-900">Announcements</h3>
        {newCount > 0 ? (
          <span className="ml-1 bg-red-800 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {newCount} new
          </span>
        ) : (
          <span className="ml-1 bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
            {sorted.length}
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {sorted.map((a) => {
          const isUrgent = a.priority === 'high';
          const dateStr = formatDate(a.published_at || a.date);
          const announcementIsNew = isNew(a.published_at || a.date);

          return (
            <div
              key={a.id}
              onClick={() => onSelect?.(a)}
              className="flex-shrink-0 w-64 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="px-4 pt-4 pb-3 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {dateStr && (
                    <span className="text-xs text-gray-400">{dateStr}</span>
                  )}
                  {announcementIsNew && (
                    <span className="text-red-600 text-[10px] font-bold uppercase tracking-wide">
                      New
                    </span>
                  )}
                  {isUrgent ? (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Urgent
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      General
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
                  {a.title}
                </h4>
                {a.content && (
                  <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{a.content}</p>
                )}
                {a.from && (
                  <p className="text-gray-400 text-xs mt-1">From: {a.from}</p>
                )}
              </div>
              <div className="px-4 pb-4">
                <div className="w-full bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl py-2 text-center text-xs font-semibold text-gray-700">
                  Read More
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
