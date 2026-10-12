'use client';

import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTableControls } from '@/hooks/use-table-controls';
import { useRefresh } from '@/lib/refresh-context';
import { useAlert } from '@/lib/use-alert';
import { useDeletePrompt } from '@/lib/use-delete-prompt';
import { Bell, Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string | null;
  target_audience: string | null;
  is_active: boolean | null;
  published_at: string | null;
  expires_at: string | null;
  author_id: string;
  created_at: string | null;
  updated_at: string | null;
}

type FlatAnnouncement = Announcement & { announcementStatus: string };

const PRIORITY_CONFIG: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  urgent: {
    label: 'Urgent',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  },
  normal: {
    label: 'Normal',
    dot: 'bg-gray-400',
    badge: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
  },
};

const PRIORITY_OPTIONS = [
  { label: 'Urgent', value: 'urgent' },
  { label: 'Normal', value: 'normal' },
];

const normalizePriority = (p: string | null): 'urgent' | 'normal' =>
  p === 'urgent' || p === 'high' ? 'urgent' : 'normal';

const AUDIENCE_OPTIONS = [
  { label: 'All Users', value: 'all' },
  { label: 'Students', value: 'students' },
  { label: 'Teachers', value: 'teachers' },
  { label: 'Guardians', value: 'parents' },
];

const defaultForm = {
  title: '',
  content: '',
  priority: 'normal',
  target_audience: 'all',
  is_active: true,
  published_at: new Date().toISOString().slice(0, 10),
  expires_at: '',
};

export default function AdminAnnouncementsPage() {
  const { admin } = useAuth();
  const { refreshKey } = useRefresh();
  const { showAlert } = useAlert();
  const { showDeletePrompt } = useDeletePrompt();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      const result = await res.json();
      if (result.success) setAnnouncements(result.data || []);
    } catch {
      showAlert({ message: 'Failed to load announcements', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements, refreshKey]);

  const flatAnnouncements: FlatAnnouncement[] = useMemo(() => {
    const now = new Date();
    return announcements.map((a) => {
      const isExpired = a.expires_at && new Date(a.expires_at) < now;
      return {
        ...a,
        priority: normalizePriority(a.priority),
        announcementStatus: a.is_active && !isExpired ? 'active' : 'inactive',
      };
    });
  }, [announcements]);

  const tc = useTableControls(flatAnnouncements, {
    searchFields: ['title', 'content'],
    defaultSort: { key: 'published_at', dir: 'desc' },
    pageSize: 25,
  });

  // Urgent announcements always stack on top within whatever page/sort is active
  const displayRows = useMemo(() => {
    return [...tc.rows].sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return 0;
    });
  }, [tc.rows]);

  const counts = useMemo(() => {
    const active = flatAnnouncements.filter(
      (a) => a.announcementStatus === 'active'
    ).length;
    const inactive = flatAnnouncements.filter(
      (a) => a.announcementStatus === 'inactive'
    ).length;
    return { all: flatAnnouncements.length, active, inactive };
  }, [flatAnnouncements]);

  const activeTab =
    (tc.filters['announcementStatus'] as string | undefined) ?? 'all';

  const handleTabChange = (tab: string) => {
    tc.setFilter('announcementStatus', tab === 'all' ? '' : tab);
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (a: Announcement) => {
    setEditingId(a.id);
    setFormData({
      title: a.title,
      content: a.content,
      priority: normalizePriority(a.priority),
      target_audience: a.target_audience || 'all',
      is_active: a.is_active ?? true,
      published_at: a.published_at
        ? new Date(a.published_at).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      expires_at: a.expires_at
        ? new Date(a.expires_at).toISOString().slice(0, 10)
        : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showAlert({ message: 'Title and content are required', type: 'warning' });
      return;
    }
    if (formData.expires_at && formData.published_at && formData.expires_at < formData.published_at) {
      showAlert({ message: 'Expiry date cannot be before the publish date', type: 'warning' });
      return;
    }
    if (formData.expires_at && formData.expires_at < new Date().toISOString().slice(0, 10)) {
      showAlert({ message: 'Expiry date is already in the past — the announcement will be inactive immediately', type: 'warning' });
    }
    setSubmitting(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId
        ? {
            id: editingId,
            ...formData,
            expires_at: formData.expires_at || null,
          }
        : {
            ...formData,
            expires_at: formData.expires_at || null,
            author_id: admin?.id,
          };
      const res = await fetch('/api/admin/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        showAlert({
          message: result.error || 'Failed to save announcement',
          type: 'error',
        });
        return;
      }
      showAlert({
        message: editingId ? 'Announcement updated!' : 'Announcement created!',
        type: 'success',
      });
      setDialogOpen(false);
      fetchAnnouncements();
    } catch {
      showAlert({ message: 'Something went wrong', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await showDeletePrompt({
      title: 'Delete Announcement',
      message: 'Delete this announcement? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      reasonLabel: 'Reason for deletion (optional)',
    });
    if (!result?.confirmed) return;
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert({ message: 'Announcement deleted', type: 'success' });
        fetchAnnouncements();
      } else {
        showAlert({ message: data.error || 'Failed to delete', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Error deleting announcement', type: 'error' });
    }
  };

  const hasFilters =
    !!tc.search ||
    !!tc.filters['priority'] ||
    !!tc.filters['target_audience'] ||
    !!tc.filters['announcementStatus'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Bell className="w-8 h-8 text-gray-700" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Create and manage announcements visible to all users
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-primary hover:bg-primary/90 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Announcement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', count: counts.all, tab: 'all' },
          { label: 'Active', count: counts.active, tab: 'active' },
          {
            label: 'Expired / Inactive',
            count: counts.inactive,
            tab: 'inactive',
          },
        ].map((s) => (
          <button
            key={s.tab}
            onClick={() => handleTabChange(s.tab)}
            className={`p-4 rounded-xl border text-left active:scale-[0.97] transition-[background-color,border-color,transform] duration-150 ease-out ${
              activeTab === s.tab
                ? 'bg-gray-900 border-gray-900'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                activeTab === s.tab ? 'text-gray-400' : 'text-gray-400'
              }`}
            >
              {s.label}
            </p>
            <p
              className={`text-2xl font-bold ${activeTab === s.tab ? 'text-white' : 'text-gray-900'}`}
            >
              {s.count}
            </p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-gray-50"
              placeholder="Search announcements..."
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
            />
          </div>
          <select
            value={tc.filters['priority'] ?? ''}
            onChange={(e) => tc.setFilter('priority', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
          <select
            value={tc.filters['target_audience'] ?? ''}
            onChange={(e) => tc.setFilter('target_audience', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All Audiences</option>
            {AUDIENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                tc.clearFilters();
                tc.setSearch('');
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr className="bg-gray-50">
              <SortHeader
                label="Title"
                sortKey="title"
                currentSort={tc.sort}
                onSort={tc.toggleSort}
                className="pl-4"
              />
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Priority
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Audience
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <SortHeader
                label="Published"
                sortKey="published_at"
                currentSort={tc.sort}
                onSort={tc.toggleSort}
              />
              <SortHeader
                label="Expires"
                sortKey="expires_at"
                currentSort={tc.sort}
                onSort={tc.toggleSort}
              />
              <th className="px-4 py-2.5 w-20 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tc.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-gray-400">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  No announcements found.
                </td>
              </tr>
            ) : (
              displayRows.map((a) => {
                const priCfg =
                  PRIORITY_CONFIG[a.priority ?? 'normal'] ??
                  PRIORITY_CONFIG['normal'];
                const isActive = a.announcementStatus === 'active';
                return (
                  <tr key={a.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 pl-4 max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {a.content}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priCfg.badge}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`}
                        />
                        {priCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {a.target_audience || 'all'}
                    </td>
                    <td className="px-4 py-3">
                      {a.expires_at && new Date(a.expires_at) < new Date() ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span className="text-xs text-red-600 font-medium">Expired</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                          />
                          <span className="text-xs text-gray-600">
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.published_at ? (
                        new Date(a.published_at).toLocaleDateString('en-PH')
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.expires_at ? (
                        new Date(a.expires_at).toLocaleDateString('en-PH')
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 pr-4">
                      <div className="flex gap-1 justify-end ">
                        <button
                          onClick={() => openEditDialog(a)}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500 hover:text-blue-700 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        <Pagination
          page={tc.page}
          onPageChange={tc.setPage}
          pageCount={tc.pageCount}
          totalCount={tc.totalCount}
          filteredCount={tc.filteredCount}
          pageSize={tc.pageSize}
          onPageSizeChange={tc.setPageSize}
        />
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingId ? 'Edit Announcement' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" required>
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Announcement title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content" required>
                Content
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Write your announcement..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label required>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) =>
                    setFormData({ ...formData, priority: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target Audience</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(v) =>
                    setFormData({ ...formData, target_audience: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label>Publish &amp; Expiry Date</Label>
              <DateRangePicker
                value={{
                  from: formData.published_at
                    ? new Date(formData.published_at + 'T00:00:00')
                    : undefined,
                  to: formData.expires_at
                    ? new Date(formData.expires_at + 'T00:00:00')
                    : undefined,
                }}
                onChange={(range) =>
                  setFormData({
                    ...formData,
                    published_at: range?.from
                      ? range.from.toISOString().slice(0, 10)
                      : new Date().toISOString().slice(0, 10),
                    expires_at: range?.to
                      ? range.to.toISOString().slice(0, 10)
                      : '',
                  })
                }
                placeholder="Select publish and expiry dates"
                disableFuture={false}
              />
              <p className="text-xs text-gray-500">
                First date = publish, second date = expiry (optional)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
