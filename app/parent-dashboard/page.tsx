'use client';

import { ActivePeriodBadge } from '@/components/ui/active-period-badge';
import { PasswordChangeWrapper } from '@/components/PasswordChangeWrapper';
import { RefreshButton } from '@/components/RefreshButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { formatDate } from '@/lib/format-date';
import { useRefresh } from '@/lib/refresh-context';
import { supabase } from '@/lib/supabaseClient';
import { useAlert } from '@/lib/use-alert';
import { useConfirm } from '@/lib/use-confirm';
import {
  Calendar,
  Camera,
  Clock,
  Eye,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  User,
  UserPlus,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SHS_STRANDS } from '@/lib/school-year';
import { ParentDashboard } from './components/ParentDashboard';

interface Child {
  id: string | number;
  name: string;
  student_id?: string;
  grade_level?: string;
  section?: string;
  email?: string;
  photo?: string;
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const { refreshKey } = useRefresh();
  const [parent, setParent] = useState<any>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [studentNumber, setStudentNumber] = useState('');
  const [relationshipType, setRelationshipType] = useState('parent');
  const [addError, setAddError] = useState('');
  const [viewingChild, setViewingChild] = useState<Child | null>(null);
  const [enrollmentRequests, setEnrollmentRequests] = useState<any[]>([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollingChild, setEnrollingChild] = useState<string>('');
  const [enrollGradeLevel, setEnrollGradeLevel] = useState('');
  const [enrollStrand, setEnrollStrand] = useState('');
  const [enrollmentType, setEnrollmentType] = useState('new');
  const [previousSchool, setPreviousSchool] = useState('');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  // Dashboard data states
  const [childStats, setChildStats] = useState<{ [childId: string]: any }>({});
  const [childClasses, setChildClasses] = useState<{
    [childId: string]: any[];
  }>({});
  const [classesLoading, setClassesLoading] = useState(false);
  const [childGrades, setChildGrades] = useState<{ [childId: string]: any[] }>(
    {}
  );
  const [childAttendance, setChildAttendance] = useState<{
    [childId: string]: any[];
  }>({});
  const [announcements, setAnnouncements] = useState<{
    [childId: string]: any[];
  }>({});

  // Function to fetch children from database
  const fetchChildren = async (parentId: string) => {
    try {
      const response = await fetch(
        `/api/parent/children?parent_id=${parentId}`
      );
      const data = await response.json();

      if (data.success && data.children) {
        setChildren(data.children);
        localStorage.setItem('parentChildren', JSON.stringify(data.children));
        // Fetch real dashboard data for all children
        await fetchDashboardDataForChildren(data.children);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  // Function to fetch dashboard data for all children
  const fetchDashboardDataForChildren = async (childrenList: Child[]) => {
    setDataLoading(true);
    const stats: any = {};
    const grades: any = {};
    const attendance: any = {};
    const announcements_data: any = {};

    // Fetch data for each child
    await Promise.all(
      childrenList.map(async (child: Child) => {
        const childId = String(child.id);

        try {
          // Fetch stats
          const statsResponse = await fetch(
            `/api/parent/student-stats?student_id=${childId}`
          );
          const statsData = await statsResponse.json();
          if (statsData.success) {
            stats[childId] = statsData.stats;
          } else {
            // Fallback to default stats
            stats[childId] = {
              gpa: 0,
              attendanceRate: 0,
              behaviorScore: 0,
              pendingTasks: 0,
            };
          }
        } catch (error) {
          console.error(`Error fetching stats for child ${childId}:`, error);
          stats[childId] = {
            gpa: 0,
            attendanceRate: 0,
            behaviorScore: 0,
            pendingTasks: 0,
          };
        }

        try {
          // Fetch grades
          const gradesResponse = await fetch(
            `/api/parent/student-grades?student_id=${childId}`
          );
          const gradesData = await gradesResponse.json();
          if (gradesData.success) {
            grades[childId] = gradesData.grades;
          } else {
            grades[childId] = [];
          }
        } catch (error) {
          console.error(`Error fetching grades for child ${childId}:`, error);
          grades[childId] = [];
        }

        try {
          // Fetch attendance (last 7 days)
          const attendanceResponse = await fetch(
            `/api/parent/student-attendance?student_id=${childId}&days=7`
          );
          const attendanceData = await attendanceResponse.json();
          if (attendanceData.success) {
            attendance[childId] = attendanceData.attendance;
          } else {
            attendance[childId] = [];
          }
        } catch (error) {
          console.error(
            `Error fetching attendance for child ${childId}:`,
            error
          );
          attendance[childId] = [];
        }

        try {
          // Fetch announcements
          const announcementsResponse = await fetch(
            `/api/parent/announcements?student_id=${childId}`
          );
          const announcementsData = await announcementsResponse.json();
          if (announcementsData.success) {
            announcements_data[childId] = announcementsData.announcements;
          } else {
            announcements_data[childId] = [];
          }
        } catch (error) {
          console.error(
            `Error fetching announcements for child ${childId}:`,
            error
          );
          announcements_data[childId] = [];
        }
      })
    );

    setChildStats(stats);
    setChildGrades(grades);
    setChildAttendance(attendance);
    setAnnouncements(announcements_data);
    setDataLoading(false);
  };

  useEffect(() => {
    // Check if parent is logged in
    const parentData = localStorage.getItem('parent');
    const childrenData = localStorage.getItem('parentChildren');

    if (!parentData) {
      router.push('/login?role=parent');
      return;
    }

    try {
      const parsedParent = JSON.parse(parentData);
      setParent(parsedParent);

      if (childrenData) {
        const parsedChildren = JSON.parse(childrenData);
        setChildren(parsedChildren);
        // Fetch real dashboard data instead of initializing with mock data
        fetchDashboardDataForChildren(parsedChildren);
      }

      // Fetch latest children data from database
      if (parsedParent.id) {
        fetchChildren(parsedParent.id);
      }
    } catch (error) {
      console.error('Error parsing parent data:', error);
      router.push('/login?role=parent');
    } finally {
      setLoading(false);
    }
  }, [router, refreshKey]);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      message: 'Are you sure you want to log out?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      localStorage.removeItem('parent');
      localStorage.removeItem('parentChildren');
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  const handleAddChild = async () => {
    if (!studentNumber.trim()) {
      setAddError('Please enter the student LRN');
      return;
    }

    setIsAddingChild(true);
    setAddError('');

    try {
      const response = await fetch('/api/parent/link-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parent_id: parent.id,
          student_number: studentNumber.trim(),
          relationship_type: relationshipType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAddError(data.error || 'Failed to add student');
        return;
      }

      // Add the new student to the children list
      const newChild = {
        id: data.student.id,
        name: data.student.name,
        student_id: data.student.student_number,
        grade_level: data.student.grade_level,
        section: data.student.section,
        email: data.student.email,
      };

      const updatedChildren = [...children, newChild];
      setChildren(updatedChildren);
      localStorage.setItem('parentChildren', JSON.stringify(updatedChildren));

      // Reset form
      setStudentNumber('');
      setRelationshipType('parent');
      setShowAddDialog(false);

      // Refresh children list from database
      if (parent.id) {
        await fetchChildren(parent.id);
      }

      showAlert({ message: 'Student added successfully!', type: 'success' });
    } catch (error) {
      console.error('Error adding student:', error);
      setAddError('Failed to add student. Please try again.');
    } finally {
      setIsAddingChild(false);
    }
  };

  const currentSchoolYear = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    return month >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  })();

  const fetchChildClasses = async (childrenList: Child[]) => {
    setClassesLoading(true);
    const classMap: { [childId: string]: any[] } = {};
    await Promise.all(
      childrenList.map(async (child) => {
        const childId = String(child.id);
        try {
          const res = await fetch(
            `/api/student/enrollment?studentId=${childId}`
          );
          const data = await res.json();
          classMap[childId] = data.success ? data.data?.classes || [] : [];
        } catch {
          classMap[childId] = [];
        }
      })
    );
    setChildClasses(classMap);
    setClassesLoading(false);
  };

  const fetchEnrollmentRequests = async () => {
    if (!parent?.id) return;
    setEnrollmentLoading(true);
    try {
      const res = await fetch(
        `/api/parent/enrollment-request?parentId=${parent.id}`
      );
      const data = await res.json();
      if (data.success) setEnrollmentRequests(data.data || []);
    } catch (err) {
      console.error('Error fetching enrollment requests:', err);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleEnrollSubmit = async () => {
    if (!enrollingChild || !enrollGradeLevel) {
      showAlert({
        message: 'Please fill in all required fields.',
        type: 'error',
      });
      return;
    }

    const needsStrand =
      enrollGradeLevel.includes('11') || enrollGradeLevel.includes('12');
    if (needsStrand && !enrollStrand) {
      showAlert({
        message: 'Please select a strand for Senior High School.',
        type: 'error',
      });
      return;
    }

    setEnrollSubmitting(true);
    try {
      const res = await fetch('/api/parent/enrollment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: parent.id,
          studentId: enrollingChild,
          gradeLevel: enrollGradeLevel,
          strand: needsStrand ? enrollStrand : null,
          schoolYear: currentSchoolYear,
          enrollmentType,
          previousSchool: previousSchool || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert({
          message: 'Enrollment request submitted successfully!',
          type: 'success',
        });
        setEnrollingChild('');
        setEnrollGradeLevel('');
        setEnrollStrand('');
        setEnrollmentType('new');
        setPreviousSchool('');
        fetchEnrollmentRequests();
      } else {
        showAlert({
          message: data.error || 'Failed to submit enrollment request.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setEnrollSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  const parentName = parent
    ? parent.first_name && parent.last_name
      ? `${parent.first_name} ${parent.last_name}`
      : parent.name || parent.email?.split('@')[0] || 'Guardian'
    : 'Guardian';

  const avatarLetters = parentName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sidebarNav = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full bg-[#111827] overflow-hidden">
      {/* Branding */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
          <Image
            src="/logo.png"
            alt="Logo"
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate leading-tight">
            St. Niño de Praga
          </p>
          <p className="text-[10px] text-gray-500 leading-none mt-0.5">
            Guardian Portal
          </p>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { key: 'children', label: 'My Students', icon: User },
          { key: 'enrollment', label: 'Enrollment', icon: GraduationCap },
          { key: 'attendance', label: 'Attendance', icon: Clock },
          { key: 'schedule', label: 'Schedule', icon: Calendar },
          { key: 'profile', label: 'My Profile', icon: Home },
        ].map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                if (key === 'enrollment') fetchEnrollmentRequests();
                if (key === 'schedule') fetchChildClasses(children);
                onNavigate?.();
              }}
              className={`group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left ${
                active
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {active && (
                <span className="absolute left-0 w-0.5 h-5 bg-red-400 rounded-full" />
              )}
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}
              />
              <span className="flex-1 truncate">{label}</span>
            </button>
          );
        })}
      </nav>
      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-800/40 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-red-300">
              {avatarLetters}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">
              {parentName}
            </p>
            <p className="text-[10px] text-gray-600 leading-none mt-0.5">
              Guardian
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (!parent || children.length === 0) {
    return (
      <PasswordChangeWrapper userId={parent?.id}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-md border-b-4 border-red-800">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Image
                    src="/logo.png"
                    alt="Sto Niño de Praga Academy Logo"
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                  <div>
                    <h1 className="text-xl font-bold text-red-800">
                      Guardian Dashboard
                    </h1>
                    <p className="text-sm text-gray-600">
                      Sto Niño de Praga Academy
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Link href="/">
                    <Button
                      variant="outline"
                      className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white bg-transparent"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-red-800">
                  No Children Linked
                </CardTitle>
                <CardDescription>
                  You don't have any children linked to your account yet. Please
                  add your child to get started.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-red-800 hover:bg-red-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Your Child
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Your Student</DialogTitle>
                      <DialogDescription>
                        Enter the student number to link them to your account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="studentNumber">LRN</Label>
                        <Input
                          id="studentNumber"
                          placeholder="12-digit LRN"
                          value={studentNumber}
                          onChange={(e) => setStudentNumber(e.target.value)}
                          disabled={isAddingChild}
                        />
                      </div>
                      <div>
                        <Label htmlFor="relationship">Relationship</Label>
                        <Select
                          value={relationshipType}
                          onValueChange={setRelationshipType}
                          disabled={isAddingChild}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="guardian">Guardian</SelectItem>
                            <SelectItem value="mother">Mother</SelectItem>
                            <SelectItem value="father">Father</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {addError && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                          {addError}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleAddChild}
                          disabled={isAddingChild}
                          className="flex-1 bg-red-800 hover:bg-red-700"
                        >
                          {isAddingChild ? 'Adding...' : 'Add Student'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddDialog(false);
                            setStudentNumber('');
                            setAddError('');
                          }}
                          disabled={isAddingChild}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </PasswordChangeWrapper>
    );
  }

  return (
    <PasswordChangeWrapper userId={parent?.id}>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 h-full flex-shrink-0">
          {sidebarNav()}
        </aside>

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Toggle menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-56">
                {sidebarNav(() => {})}
              </SheetContent>
            </Sheet>
            <span className="text-sm font-semibold text-gray-900">
              Guardian Portal
            </span>
            <div className="ml-auto flex items-center gap-2">
              <RefreshButton />
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Your Student</DialogTitle>
                    <DialogDescription>
                      Enter the student number to link them to your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="studentNumberMobile">
                        LRN
                      </Label>
                      <Input
                        id="studentNumberMobile"
                        placeholder="12-digit LRN"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        disabled={isAddingChild}
                      />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <Select
                        value={relationshipType}
                        onValueChange={setRelationshipType}
                        disabled={isAddingChild}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guardian">Guardian</SelectItem>
                          <SelectItem value="mother">Mother</SelectItem>
                          <SelectItem value="father">Father</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {addError && (
                      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                        {addError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddChild}
                        disabled={isAddingChild}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        {isAddingChild ? 'Adding...' : 'Add Student'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddDialog(false);
                          setStudentNumber('');
                          setAddError('');
                        }}
                        disabled={isAddingChild}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Desktop top bar */}
          <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-900">
              Guardian Portal
            </span>
            <RefreshButton />
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Your Student</DialogTitle>
                  <DialogDescription>
                    Enter the student number to link them to your account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="studentNumber">LRN</Label>
                    <Input
                      id="studentNumber"
                      placeholder="12-digit LRN"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      disabled={isAddingChild}
                    />
                  </div>
                  <div>
                    <Label>Relationship</Label>
                    <Select
                      value={relationshipType}
                      onValueChange={setRelationshipType}
                      disabled={isAddingChild}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guardian">Guardian</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="father">Father</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {addError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                      {addError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddChild}
                      disabled={isAddingChild}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {isAddingChild ? 'Adding...' : 'Add Student'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddDialog(false);
                        setStudentNumber('');
                        setAddError('');
                      }}
                      disabled={isAddingChild}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Content Area */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {/* Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome, {parent.name || parent.email || 'Guardian'}!
                  </h2>
                  <p className="text-gray-600">
                    Monitor your children's academic progress and school
                    activities.
                  </p>
                  <div className="mt-2"><ActivePeriodBadge /></div>
                </div>

                {/* Data Loading Indicator */}
                {dataLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading dashboard data...</p>
                  </div>
                )}

                {/* Integrated Guardian Dashboard Component */}
                {!dataLoading && (
                  <ParentDashboard
                    children={children}
                    childStats={childStats}
                    childGrades={childGrades}
                    childAttendance={childAttendance}
                    announcements={announcements}
                  />
                )}
              </div>
            )}

            {/* My Students */}
            {activeTab === 'children' && (
              <div className="space-y-6">
                {viewingChild ? (
                  /* ── Full Student Portal View ── */
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setViewingChild(null)}
                      className="mb-4 text-gray-600 hover:text-gray-900 -ml-2"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back to Students
                    </Button>

                    {/* Student Header */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                        {viewingChild.photo ||
                          viewingChild.name?.charAt(0) ||
                          'S'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {viewingChild.name}
                        </h2>
                        <p className="text-gray-500">
                          {viewingChild.grade_level || 'N/A'} -{' '}
                          {viewingChild.section || 'N/A'} |{' '}
                          {viewingChild.student_id || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Grades Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-red-800">Grades</CardTitle>
                          <CardDescription>
                            Academic performance by subject
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(childGrades[String(viewingChild.id)] || []).length >
                          0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-gray-50">
                                    <th className="text-left py-2.5 px-3 text-gray-600 font-semibold">
                                      Subject
                                    </th>
                                    <th className="text-center py-2.5 px-3 text-gray-600 font-semibold">
                                      Quarter
                                    </th>
                                    <th className="text-center py-2.5 px-3 text-gray-600 font-semibold">
                                      Grade
                                    </th>
                                    <th className="text-center py-2.5 px-3 text-gray-600 font-semibold">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(
                                    childGrades[String(viewingChild.id)] || []
                                  ).map((g: any, idx: number) => (
                                    <tr
                                      key={idx}
                                      className="border-b last:border-0 hover:bg-gray-50"
                                    >
                                      <td className="py-2.5 px-3 font-medium">
                                        {g.subject}
                                      </td>
                                      <td className="text-center py-2.5 px-3 text-gray-500">
                                        Q{g.quarter || '-'}
                                      </td>
                                      <td className="text-center py-2.5 px-3">
                                        <span
                                          className={`font-bold ${Number(g.grade) >= 75 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          {g.grade}
                                        </span>
                                      </td>
                                      <td className="text-center py-2.5 px-3">
                                        <span
                                          className={`text-xs px-2 py-0.5 rounded-full ${g.status === 'approved' ? 'bg-green-100 text-green-700' : g.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                          {g.status || 'N/A'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <p>No grades available yet.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Attendance Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-red-800">
                            Attendance
                          </CardTitle>
                          <CardDescription>
                            Recent attendance records
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(childAttendance[String(viewingChild.id)] || [])
                            .length > 0 ? (
                            <div className="space-y-0">
                              {(
                                childAttendance[String(viewingChild.id)] || []
                              ).map((a: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-2.5 px-3 border-b last:border-0 hover:bg-gray-50"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {formatDate(a.scan_time || a.date)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {a.scan_time
                                        ? new Date(
                                            a.scan_time
                                          ).toLocaleTimeString('en-PH', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : ''}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                      a.scan_type === 'timein' ||
                                      a.status === 'present'
                                        ? 'bg-green-100 text-green-700'
                                        : a.scan_type === 'timeout'
                                          ? 'bg-blue-100 text-blue-700'
                                          : a.status === 'absent'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-orange-100 text-orange-700'
                                    }`}
                                  >
                                    {a.scan_type === 'timein'
                                      ? 'Time In'
                                      : a.scan_type === 'timeout'
                                        ? 'Time Out'
                                        : a.status || 'N/A'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-400">
                              <p>No attendance records yet.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  /* ── Student List ── */
                  <>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        My Students
                      </h2>
                      <p className="text-gray-600">
                        Select a student to view their grades and attendance.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {children.map((child) => (
                        <Card
                          key={child.id}
                          className="border-red-200 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => setViewingChild(child)}
                        >
                          <CardHeader>
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                {child.photo || child.name?.charAt(0) || 'S'}
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-red-800">
                                  {child.name}
                                </CardTitle>
                                <CardDescription>
                                  {child.grade_level || 'N/A'} -{' '}
                                  {child.section || 'N/A'}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                  Student ID
                                </span>
                                <span className="font-medium">
                                  {child.student_id || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Email</span>
                                <span className="font-medium text-xs">
                                  {child.email || 'N/A'}
                                </span>
                              </div>
                              <div className="pt-2">
                                <Button
                                  className="w-full bg-red-800 hover:bg-red-700"
                                  size="sm"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Enrollment */}
            {activeTab === 'enrollment' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Enrollment
                  </h2>
                  <p className="text-gray-600">
                    Submit enrollment requests for your children.
                  </p>
                </div>

                {/* Enrollment Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-800">
                      New Enrollment Request
                    </CardTitle>
                    <CardDescription>
                      Select a child and fill in the enrollment details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label required>Select Child</Label>
                        <Select
                          value={enrollingChild}
                          onValueChange={setEnrollingChild}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {children.map((child) => (
                              <SelectItem
                                key={String(child.id)}
                                value={String(child.id)}
                              >
                                {child.name} ({child.student_id || 'N/A'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label required>Grade Level</Label>
                        <Select
                          value={enrollGradeLevel}
                          onValueChange={(v) => {
                            setEnrollGradeLevel(v);
                            setEnrollStrand('');
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                          <SelectContent>
                            {[
                              'Grade 1',
                              'Grade 2',
                              'Grade 3',
                              'Grade 4',
                              'Grade 5',
                              'Grade 6',
                              'Grade 7',
                              'Grade 8',
                              'Grade 9',
                              'Grade 10',
                              'Grade 11',
                              'Grade 12',
                            ].map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label required>Enrollment Type</Label>
                        <Select
                          value={enrollmentType}
                          onValueChange={setEnrollmentType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New Student</SelectItem>
                            <SelectItem value="returning">Returning Student</SelectItem>
                            <SelectItem value="transferee">Transferee</SelectItem>
                            <SelectItem value="returnee">Returnee</SelectItem>
                            <SelectItem value="repeater">Repeater</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {(enrollmentType === 'transferee' ||
                        enrollmentType === 'returnee') && (
                        <div className="space-y-2">
                          <Label>Previous School</Label>
                          <Input
                            value={previousSchool}
                            onChange={(e) => setPreviousSchool(e.target.value)}
                            placeholder="Enter previous school name"
                          />
                        </div>
                      )}

                      {(enrollGradeLevel.includes('11') ||
                        enrollGradeLevel.includes('12')) && (
                        <div className="space-y-2">
                          <Label required>Strand</Label>
                          <Select
                            value={enrollStrand}
                            onValueChange={setEnrollStrand}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select strand" />
                            </SelectTrigger>
                            <SelectContent>
                              {SHS_STRANDS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>School Year</Label>
                        <Input value={currentSchoolYear} disabled />
                      </div>
                    </div>

                    <Button
                      className="mt-6 bg-red-800 hover:bg-red-700"
                      onClick={handleEnrollSubmit}
                      disabled={enrollSubmitting}
                    >
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {enrollSubmitting
                        ? 'Submitting...'
                        : 'Submit Enrollment Request'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Enrollment Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-800">
                      Enrollment History
                    </CardTitle>
                    <CardDescription>
                      Status of submitted enrollment requests.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {enrollmentLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800"></div>
                      </div>
                    ) : enrollmentRequests.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <GraduationCap className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No enrollment requests yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enrollmentRequests.map((req: any) => {
                          const child = children.find(
                            (c) => String(c.id) === String(req.student_id)
                          );
                          return (
                            <div
                              key={req.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {child?.name || 'Unknown Student'}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {req.grade_level}
                                  {req.strand ? ` - ${req.strand}` : ''} |{' '}
                                  {req.school_year}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Submitted:{' '}
                                  {formatDate(req.created_at)}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  req.status === 'approved'
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : req.status === 'rejected'
                                      ? 'bg-red-50 text-red-700 border-red-300'
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                }
                              >
                                {req.status?.charAt(0).toUpperCase() +
                                  req.status?.slice(1) || 'Pending'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Attendance */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Recent scan records for each child.</p>
                </div>

                {children.map((child) => {
                  const childId = String(child.id);
                  const records: any[] = childAttendance[childId] || [];
                  const stats = childStats[childId];

                  const present = records.filter((a) => a.status === 'present').length;
                  const late    = records.filter((a) => a.status === 'late').length;
                  const absent  = records.filter((a) => a.status === 'absent').length;

                  const statusBadge = (s: string) => {
                    if (s === 'present') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Present</span>;
                    if (s === 'late')    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Late</span>;
                    return                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Absent</span>;
                  };

                  return (
                    <div key={child.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Child header + stats */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{child.name}</p>
                          <p className="text-xs text-gray-500">{child.grade_level || 'N/A'} – {child.section || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {stats && stats.attendanceRate > 0 && (
                            <span className="font-semibold text-gray-700">{stats.attendanceRate.toFixed(0)}%</span>
                          )}
                          {records.length > 0 && (
                            <div className="flex gap-1">
                              {present > 0 && <span className="bg-green-100 text-green-700 rounded px-1.5 py-0.5 font-medium">{present}P</span>}
                              {late > 0    && <span className="bg-yellow-100 text-yellow-700 rounded px-1.5 py-0.5 font-medium">{late}L</span>}
                              {absent > 0  && <span className="bg-red-100 text-red-700 rounded px-1.5 py-0.5 font-medium">{absent}A</span>}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Records list */}
                      {records.length === 0 ? (
                        <div className="px-4 py-5 text-center text-xs text-gray-400">No recent attendance records.</div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {records.slice(0, 10).map((a: any, i: number) => {
                            const dt = new Date(a.scan_time || a.date);
                            const dateStr = formatDate(a.scan_time || a.date);
                            const timeStr = a.scan_time ? dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—';
                            const scanLabel = a.scan_type === 'timein' ? 'Time In' : a.scan_type === 'timeout' ? 'Time Out' : a.scan_type || '—';
                            return (
                              <div key={i} className="flex items-center justify-between px-4 py-2">
                                <div className="flex items-center gap-3">
                                  <div className="text-xs text-gray-500 w-32 shrink-0">{dateStr}</div>
                                  <div className="text-xs text-gray-700">{timeStr}</div>
                                  <div className="text-xs text-gray-400">{scanLabel}</div>
                                </div>
                                {statusBadge(a.status)}
                              </div>
                            );
                          })}
                          {records.length > 10 && (
                            <div className="px-4 py-2 text-center text-xs text-gray-400">+{records.length - 10} more records</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Schedule */}
            {activeTab === 'schedule' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Weekly Schedule
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Class times per day for each student.
                  </p>
                </div>

                {classesLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {children.map((child) => {
                      const childId = String(child.id);
                      const classes = childClasses[childId] || [];

                      const DAY_ORDER = ['M', 'T', 'W', 'Th', 'F'];
                      const DAY_LABELS: Record<string, string> = {
                        M: 'Monday',
                        T: 'Tuesday',
                        W: 'Wednesday',
                        Th: 'Thursday',
                        F: 'Friday',
                      };

                      const scheduleByDay: Record<
                        string,
                        {
                          className: string;
                          start: string;
                          end: string;
                          room: string;
                          teacher: string;
                        }[]
                      > = {};
                      DAY_ORDER.forEach((d) => {
                        scheduleByDay[d] = [];
                      });

                      const unscheduled: string[] = [];

                      for (const cls of classes) {
                        if (!cls.schedule) {
                          unscheduled.push(cls.className);
                          continue;
                        }
                        try {
                          const entries: {
                            day: string;
                            start: string;
                            end: string;
                          }[] =
                            typeof cls.schedule === 'string'
                              ? JSON.parse(cls.schedule)
                              : cls.schedule;
                          if (!entries.length) {
                            unscheduled.push(cls.className);
                            continue;
                          }
                          for (const e of entries) {
                            if (scheduleByDay[e.day]) {
                              scheduleByDay[e.day].push({
                                className: cls.className,
                                start: e.start,
                                end: e.end,
                                room: cls.room || '',
                                teacher:
                                  cls.teacher !== 'TBD'
                                    ? cls.teacher || ''
                                    : '',
                              });
                            }
                          }
                        } catch {
                          unscheduled.push(cls.className);
                        }
                      }

                      DAY_ORDER.forEach((d) =>
                        scheduleByDay[d].sort((a, b) =>
                          a.start.localeCompare(b.start)
                        )
                      );

                      const fmt = (t: string) => {
                        const [h, m] = t.split(':').map(Number);
                        const suffix = h < 12 ? 'AM' : 'PM';
                        const hour = h % 12 || 12;
                        return m === 0
                          ? `${hour} ${suffix}`
                          : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
                      };

                      const activeDays = DAY_ORDER.filter(
                        (d) => scheduleByDay[d].length > 0
                      );
                      const hasAnySchedule = activeDays.length > 0;

                      return (
                        <div
                          key={child.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                          {/* Child header */}
                          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-gray-600">
                                {child.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {child.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {child.grade_level || 'N/A'} —{' '}
                                {child.section || 'N/A'}
                              </p>
                            </div>
                          </div>

                          {classes.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                              <GraduationCap className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">
                                No classes enrolled yet.
                              </p>
                            </div>
                          ) : !hasAnySchedule ? (
                            <div className="px-5 py-8 text-center text-gray-400">
                              <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">
                                No schedule set for these classes yet.
                              </p>
                              {unscheduled.length > 0 && (
                                <p className="text-xs text-gray-300 mt-1">
                                  {unscheduled.join(', ')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {activeDays.map((day) => (
                                <div key={day} className="px-5 py-4">
                                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                                    {DAY_LABELS[day]}
                                  </p>
                                  <div className="space-y-2">
                                    {scheduleByDay[day].map((entry, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5"
                                      >
                                        <div className="text-xs font-mono text-gray-500 w-28 shrink-0">
                                          {fmt(entry.start)} – {fmt(entry.end)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900">
                                            {entry.className}
                                          </p>
                                          <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                                            {entry.room && (
                                              <span>Room {entry.room}</span>
                                            )}
                                            {entry.teacher && (
                                              <span>{entry.teacher}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {unscheduled.length > 0 && (
                                <div className="px-5 py-3 bg-gray-50">
                                  <p className="text-[11px] text-gray-400">
                                    No time set: {unscheduled.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'profile' && (
              <ProfileTab
                parent={parent}
                onSaved={(updated: any) => {
                  setParent(updated);
                  localStorage.setItem('parent', JSON.stringify(updated));
                }}
              />
            )}
          </main>
        </div>
      </div>
    </PasswordChangeWrapper>
  );
}

function ProfileTab({
  parent,
  onSaved,
}: {
  parent: any;
  onSaved: (updated: any) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    parent?.photo_url ?? null
  );
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
  });

  const displayName = parent
    ? [parent.first_name, parent.middle_name, parent.last_name, parent.suffix]
        .filter(Boolean)
        .join(' ') ||
      parent.email?.split('@')[0] ||
      'Guardian'
    : 'Guardian';

  const avatarLetters = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !parent) return;
    setUploadingAvatar(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('userId', String(parent.id));
      fd.append('role', 'parent');

      const uploadRes = await fetch('/api/upload-avatar', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);
      const url = uploadData.url;

      const res = await fetch('/api/parent/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: parent.id, photo_url: url }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setAvatarUrl(url);
      onSaved({ ...parent, photo_url: url });
    } catch (e: any) {
      setError(e.message || 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEdit = () => {
    setForm({
      first_name: parent.first_name || '',
      last_name: parent.last_name || '',
      middle_name: parent.middle_name || '',
      suffix: parent.suffix || '',
      phone_number: parent.phone_number || parent.phone || '',
      address: parent.address || '',
    });
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/parent/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: parent.id, ...form }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to save.');
      onSaved({ ...parent, ...form });
      setEditing(false);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Avatar + Name */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-purple-700/20 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-purple-700">
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
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{parent?.email}</p>
            <span className="inline-flex items-center mt-1.5 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
              Guardian
            </span>
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
            Your contact details and address
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
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, Barangay, City"
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
              { icon: Mail, label: 'Email', value: parent?.email },
              {
                icon: Phone,
                label: 'Contact Number',
                value: parent?.phone_number || parent?.phone,
              },
              { icon: MapPin, label: 'Address', value: parent?.address },
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
