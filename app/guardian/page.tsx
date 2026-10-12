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
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, ChevronRight, Menu, Search } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { GuardianSidebarContent } from './components/GuardianSidebar';

// Mock data matching the student portal
const mockAssignments = [
  {
    id: 1,
    title: 'Quadratic Equations Problem Set',
    subject: 'Mathematics',
    dueDate: 'Due: Dec 15, 2024',
    status: 'pending',
    statusText: 'Pending',
  },
  {
    id: 2,
    title: 'Science Lab Report',
    subject: 'Science',
    dueDate: 'Due: Dec 18, 2024',
    status: 'submitted',
    statusText: 'Submitted',
  },
  {
    id: 3,
    title: 'Essay on Philippine Literature',
    subject: 'Filipino',
    dueDate: 'Due: Dec 20, 2024',
    status: 'pending',
    statusText: 'Pending',
  },
];

const mockCourseProgress = [
  { subject: 'Advanced Mathematics', progress: 75 },
  { subject: 'General Science', progress: 60 },
  { subject: 'English Literature', progress: 85 },
];

export default function GuardianDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <GuardianSidebarContent
                  activeNav={activeNav}
                  setActiveNav={setActiveNav}
                />
              </SheetContent>
            </Sheet>

            <Image
              src="/logo.png"
              alt="Sto Niño de Praga Academy Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <h1 className="text-base md:text-lg font-semibold text-gray-800">
                Guardian Portal
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Sto Niño de Praga Academy
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Bell className="w-4 h-4" />
            </Button>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                MT
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">Maria Torres</p>
                <p className="text-xs text-gray-500">Guardian</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="hidden md:block w-64 bg-white min-h-screen border-r border-gray-200">
          <GuardianSidebarContent
            activeNav={activeNav}
            setActiveNav={setActiveNav}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Welcome back, Maria Torres!
                </h2>
                <p className="text-gray-600">
                  Here's Miguel's academic overview for today.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Current GPA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-gray-900">3.85</div>
                    <div className="flex items-center mt-1">
                      <ChevronRight className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 ml-1">
                        Excellent
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Attendance Rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-gray-900">
                      95.5%
                    </div>
                    <div className="flex items-center mt-1">
                      <ChevronRight className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600 ml-1">Great</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Active Courses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-gray-900">5</div>
                    <div className="flex items-center mt-1">
                      <ChevronRight className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-purple-600 ml-1">
                        This quarter
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Pending Tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="flex items-center mt-1">
                      <ChevronRight className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-600 ml-1">
                        Due soon
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Assignments and Course Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Assignments */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Recent Assignments
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Miguel's latest assignments and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {assignment.title}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {assignment.subject}
                            </p>
                            <p className="text-xs text-gray-500">
                              {assignment.dueDate}
                            </p>
                          </div>
                          <Badge
                            variant={
                              assignment.status === 'submitted'
                                ? 'default'
                                : 'destructive'
                            }
                            className={`text-xs ${
                              assignment.status === 'submitted'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {assignment.statusText}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Course Progress */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Course Progress
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Miguel's progress in current subjects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockCourseProgress.map((course, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {course.subject}
                            </span>
                            <span className="text-sm text-gray-500">
                              {course.progress}%
                            </span>
                          </div>
                          <Progress
                            value={course.progress}
                            className="h-2 bg-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeNav === 'enrollment' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Enrollment</h2>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Enrollment Status</CardTitle>
                  <CardDescription>
                    Miguel's current enrollment status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <h4 className="font-medium text-green-800">
                          Enrollment Status
                        </h4>
                        <p className="text-sm text-green-600">
                          Currently Enrolled - Grade 10
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-800">
                        Academic Year
                      </h4>
                      <p className="text-sm text-gray-600">2024-2025</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeNav === 'schedule' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Schedule Calendar
              </h2>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Class Schedule</CardTitle>
                  <CardDescription>
                    Miguel's weekly class schedule and important dates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4 text-red-800">
                        Today's Classes
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div>
                            <h5 className="font-medium text-blue-800">
                              Mathematics
                            </h5>
                            <p className="text-sm text-blue-600">
                              Room 201 - Prof. Rodriguez
                            </p>
                          </div>
                          <span className="text-sm font-medium text-blue-600">
                            8:00 AM
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div>
                            <h5 className="font-medium text-green-800">
                              Science
                            </h5>
                            <p className="text-sm text-green-600">
                              Lab 101 - Prof. Santos
                            </p>
                          </div>
                          <span className="text-sm font-medium text-green-600">
                            10:00 AM
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div>
                            <h5 className="font-medium text-purple-800">
                              English
                            </h5>
                            <p className="text-sm text-purple-600">
                              Room 105 - Prof. Garcia
                            </p>
                          </div>
                          <span className="text-sm font-medium text-purple-600">
                            1:00 PM
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-4 text-red-800">
                        Upcoming Events
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <h5 className="font-medium text-orange-800">
                            Math Quiz
                          </h5>
                          <p className="text-sm text-orange-600">
                            December 20, 2024
                          </p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <h5 className="font-medium text-red-800">
                            Science Project Due
                          </h5>
                          <p className="text-sm text-red-600">
                            December 22, 2024
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                          <h5 className="font-medium text-indigo-800">
                            Christmas Break
                          </h5>
                          <p className="text-sm text-indigo-600">
                            December 23 - January 3
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeNav === 'grades' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Grades & Reports
              </h2>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Current Grades</CardTitle>
                  <CardDescription>
                    Miguel's grades for the current quarter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800">Mathematics</h4>
                      <p className="text-2xl font-bold text-blue-600">92</p>
                      <p className="text-sm text-blue-600">Excellent</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800">Science</h4>
                      <p className="text-2xl font-bold text-green-600">88</p>
                      <p className="text-sm text-green-600">Very Good</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h4 className="font-medium text-purple-800">English</h4>
                      <p className="text-2xl font-bold text-purple-600">90</p>
                      <p className="text-sm text-purple-600">Excellent</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h4 className="font-medium text-orange-800">Filipino</h4>
                      <p className="text-2xl font-bold text-orange-600">87</p>
                      <p className="text-sm text-orange-600">Very Good</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800">
                        Social Studies
                      </h4>
                      <p className="text-2xl font-bold text-red-600">89</p>
                      <p className="text-sm text-red-600">Very Good</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h4 className="font-medium text-indigo-800">
                        Physical Education
                      </h4>
                      <p className="text-2xl font-bold text-indigo-600">95</p>
                      <p className="text-sm text-indigo-600">Outstanding</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeNav === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Student Profile
              </h2>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Miguel's student profile and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <p className="text-gray-900">Miguel Torres</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student ID
                      </label>
                      <p className="text-gray-900">2024-001234</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Level
                      </label>
                      <p className="text-gray-900">Grade 10</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section
                      </label>
                      <p className="text-gray-900">St. Joseph</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">
                        miguel.torres@student.stonino-praga.edu.ph
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <p className="text-gray-900">0917-123-4567</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
