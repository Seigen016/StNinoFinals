'use client';

import { ActivePeriodBadge } from '@/components/ui/active-period-badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRefresh } from '@/lib/refresh-context';
import {
  Activity,
  GraduationCap,
  Printer,
  Radio,
  RotateCcw,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { genderBars } from '@/components/admin/gender-bars';
import { useAdminData } from './hooks/useAdminData';
import { useAuth } from './hooks/useAuth';

export default function AdminPage() {
  const { admin } = useAuth();
  const { stats: baseStats, loadingStats } = useAdminData(admin);
  const { refreshKey } = useRefresh();
  const [chartData, setChartData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<
    { from?: Date; to?: Date } | undefined
  >({
    from: new Date(),
    to: new Date(),
  });
  const [filteredStats, setFilteredStats] = useState<any>(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string | null>(
    null
  );
  const [gradeStudents, setGradeStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const stats = filteredStats || baseStats;

  const toIso = (d: Date) => d.toISOString().split('T')[0];

  // Weekly trend + grade-approval queue aren't scoped to the date picker
  // (see chart-data route), so they're fetched once, not on every range change.
  const fetchChartData = () => {
    fetch('/api/admin/chart-data')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setChartData(res.data);
      })
      .catch(console.error);
  };

  const fetchStats = (range?: { from?: Date; to?: Date }) => {
    const params = new URLSearchParams();
    if (range?.from) params.set('startDate', toIso(range.from));
    if (range?.to) params.set('endDate', toIso(range.to));
    fetch(`/api/admin/stats?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setFilteredStats(res.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (!admin) return;
    fetchChartData();
    fetchStats(dateRange);
    fetch('/api/announcements?role=admin')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAnnouncements(res.data || []);
      })
      .catch(console.error);
  }, [admin, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateRangeChange = (
    range: { from?: Date; to?: Date } | undefined
  ) => {
    setDateRange(range);
    if (range?.from && range?.to) fetchStats(range);
  };

  const handleResetToToday = () => {
    const today = { from: new Date(), to: new Date() };
    setDateRange(today);
    setFilteredStats(null);
    fetchStats(today);
  };

  const handleBarClick = async (gradeLevel: string) => {
    setSelectedGradeLevel(gradeLevel);
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/admin/students');
      const result = await res.json();
      if (result.success) {
        setGradeStudents(
          (result.students || result.data || []).filter(
            (s: any) => s.grade_level === gradeLevel
          )
        );
      }
    } catch {
      setGradeStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const cap = (s: string) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
    const rows = gradeStudents
      .map(
        (s, i) =>
          `<tr><td>${i + 1}</td><td>${cap(s.first_name || '')} ${cap(s.last_name || '')}</td><td>${s.student_number || '—'}</td><td>${s.section || '—'}</td></tr>`
      )
      .join('');
    w.document.write(`<html><head><title>${selectedGradeLevel}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{padding:8px 12px;border:1px solid #e5e7eb;text-align:left}th{background:#991b1b;color:white}</style>
      </head><body><h2>Sto. Niño de Praga Academy</h2><h3>${selectedGradeLevel} — ${gradeStudents.length} students</h3>
      <table><thead><tr><th>#</th><th>Name</th><th>LRN</th><th>Section</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close();
    w.print();
  };

  if (!admin) return null;

  const statCards = [
    {
      label: 'Total Students',
      value: stats.totalStudents,
      sub: 'All grade levels',
      icon: Users,
    },
    {
      label: 'Total Teachers',
      value: stats.totalTeachers,
      sub: 'Active faculty',
      icon: Shield,
    },
    {
      label: 'Total Guardians',
      value: stats.totalParents,
      sub: 'Active guardians',
      icon: UserCog,
    },
    {
      label: 'Attendance Rate',
      value: `${stats.attendanceRate ?? 0}%`,
      sub: filteredStats ? 'Filtered' : 'Today',
      icon: Activity,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, {admin.first_name || 'Admin'}.
          </p>
          <div className="mt-1.5">
            <ActivePeriodBadge />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder="Select date range"
          />
          <Button onClick={handleResetToToday} variant="outline" size="sm">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Today
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {label}
              </p>
              <Icon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {loadingStats ? <span className="text-gray-300">—</span> : value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            href: '/admin/students',
            icon: Users,
            label: 'Manage Students',
            sub: 'View and edit records',
          },
          {
            href: '/admin/teachers',
            icon: Shield,
            label: 'Manage Teachers',
            sub: 'View and edit accounts',
          },
          {
            href: '/admin/live-attendance',
            icon: Radio,
            label: 'Live Attendance',
            sub: 'Real-time tracking',
          },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md active:scale-[0.98] transition-[border-color,box-shadow,transform] duration-150 ease-out"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Weekly Attendance */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Weekly Attendance
            </p>
          </div>
          <div className="p-5">
            {!chartData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-900 border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData.weeklyAttendance}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                  <Bar
                    dataKey="present"
                    name="Present"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="Absent"
                    fill="#fca5a5"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Grade Approvals */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              Grade Approvals
            </p>
          </div>
          <div className="p-5">
            {!chartData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-900 border-t-transparent" />
              </div>
            ) : chartData.gradeApprovals.every((e: any) => e.value === 0) ? (
              <div className="flex flex-col items-center justify-center py-8">
                <GraduationCap className="w-7 h-7 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">
                  No grade submissions yet
                </p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={chartData.gradeApprovals}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.gradeApprovals.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-1">
                  {chartData.gradeApprovals.map((e: any) => (
                    <div
                      key={e.name}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: e.fill }}
                      />
                      <span className="text-gray-500">{e.name}</span>
                      <span className="font-semibold text-gray-900">
                        {e.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grade Level Population */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Grade Level Population
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Click a bar to view students in that grade
          </p>
        </div>
        <div className="p-5">
          {stats.gradeDistribution &&
          Object.keys(stats.gradeDistribution).length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={Math.max(
                200,
                Object.keys(stats.gradeDistribution).length * 40
              )}
            >
              <BarChart
                layout="vertical"
                data={Object.entries(stats.gradeDistribution)
                  .sort(([a], [b]) =>
                    a.localeCompare(b, undefined, { numeric: true })
                  )
                  .map(([grade, count]) => ({
                    grade,
                    count,
                    ...(stats.gradeGender?.[grade] ?? { male: 0, female: 0, unspecified: count }),
                  }))}
                margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="grade"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                {genderBars('vertical', (data: any) => {
                  if (data?.grade) handleBarClick(data.grade);
                })}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No student data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Student List Dialog */}
      <Dialog
        open={!!selectedGradeLevel}
        onOpenChange={(open) => !open && setSelectedGradeLevel(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <div className="bg-gray-900 text-white px-6 py-5 rounded-t-lg">
            <p className="text-xs text-gray-400 mb-1">
              Sto. Niño de Praga Academy
            </p>
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-bold">
                {selectedGradeLevel}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-300">
                {gradeStudents.length} student
                {gradeStudents.length !== 1 ? 's' : ''} enrolled
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={gradeStudents.length === 0}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print
              </Button>
            </div>
          </div>
          <div className="px-6 py-4">
            {loadingStudents ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-900 border-t-transparent" />
              </div>
            ) : gradeStudents.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">
                No students found
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {gradeStudents.map((s: any, i: number) => {
                  const cap = (str: string) =>
                    str
                      ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
                      : '';
                  const name =
                    `${cap(s.first_name || '')} ${cap(s.last_name || '')}`.trim();
                  return (
                    <div key={s.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-6 text-xs text-gray-300 tabular-nums text-right shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {name || '—'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {s.student_number || 'No student no.'}
                        </p>
                      </div>
                      {s.section && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                          {s.section}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
