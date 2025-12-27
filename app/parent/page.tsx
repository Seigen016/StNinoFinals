"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabaseClient"
import { useAlert } from "@/lib/use-alert"
import { useConfirm } from "@/lib/use-confirm"
import { Calendar, Clock, Eye, Home, LayoutDashboard, LogOut, MessageSquare, User, UserPlus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ParentDashboard } from "./components/ParentDashboard"

interface Child {
  id: string | number
  name: string
  student_id?: string
  grade_level?: string
  section?: string
  email?: string
  photo?: string
}

export default function ParentPortal() {
  const router = useRouter()
  const [parent, setParent] = useState<any>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddingChild, setIsAddingChild] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [studentNumber, setStudentNumber] = useState("")
  const [relationshipType, setRelationshipType] = useState("parent")
  const [addError, setAddError] = useState("")
  const { showAlert } = useAlert()
  const { showConfirm } = useConfirm()

  // Dashboard data states
  const [childStats, setChildStats] = useState<{ [childId: string]: any }>({})
  const [childGrades, setChildGrades] = useState<{ [childId: string]: any[] }>({})
  const [childAttendance, setChildAttendance] = useState<{ [childId: string]: any[] }>({})
  const [announcements, setAnnouncements] = useState<{ [childId: string]: any[] }>({})

  useEffect(() => {
    // Check if parent is logged in
    const parentData = localStorage.getItem("parent")
    const childrenData = localStorage.getItem("parentChildren")

    if (!parentData) {
      router.push("/")
      return
    }

    try {
      setParent(JSON.parse(parentData))
      if (childrenData) {
        const parsedChildren = JSON.parse(childrenData)
        setChildren(parsedChildren)
        if (parsedChildren.length > 0) {
          setSelectedChild(parsedChildren[0])
        }
        
        // Initialize mock dashboard data for each child
        const stats: any = {}
        const grades: any = {}
        const attendance: any = {}
        const announcements_data: any = {}
        
        parsedChildren.forEach((child: Child) => {
          const childId = String(child.id)
          
          // Mock stats
          stats[childId] = {
            gpa: 93.5 + Math.random() * 3,
            attendanceRate: 92 + Math.random() * 6,
            behaviorScore: 85 + Math.random() * 10,
            pendingTasks: Math.floor(Math.random() * 5),
          }
          
          // Mock grades
          grades[childId] = [
            { subject: "Mathematics", grade: "95", lastUpdated: new Date().toISOString() },
            { subject: "English", grade: "92", lastUpdated: new Date().toISOString() },
            { subject: "Science", grade: "94", lastUpdated: new Date().toISOString() },
            { subject: "Filipino", grade: "90", lastUpdated: new Date().toISOString() },
            { subject: "History", grade: "93", lastUpdated: new Date().toISOString() },
            { subject: "PE", grade: "96", lastUpdated: new Date().toISOString() },
          ]
          
          // Mock attendance (last 7 days)
          const attendanceRecords = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const statuses = ['present', 'present', 'present', 'present', 'late', 'present']
            attendanceRecords.push({
              date: date.toISOString(),
              status: statuses[Math.floor(Math.random() * statuses.length)],
              time: '7:45 AM',
            })
          }
          attendance[childId] = attendanceRecords
          
          // Mock announcements
          announcements_data[childId] = [
            {
              id: '1',
              title: 'Parent-Teacher Conference Next Week',
              date: new Date().toISOString(),
              from: 'Homeroom Teacher',
              priority: 'high',
            },
            {
              id: '2',
              title: 'Field Trip Permission Slip Required',
              date: new Date().toISOString(),
              from: 'Class Adviser',
              priority: 'medium',
            },
            {
              id: '3',
              title: 'Upcoming School Event',
              date: new Date().toISOString(),
              from: 'School Admin',
              priority: 'low',
            },
          ]
        })
        
        setChildStats(stats)
        setChildGrades(grades)
        setChildAttendance(attendance)
        setAnnouncements(announcements_data)
      }
    } catch (error) {
      console.error("Error parsing parent data:", error)
      router.push("/")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      message: "Are you sure you want to log out?",
      confirmText: "Logout",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (confirmed) {
      await supabase.auth.signOut()
      localStorage.removeItem("parent")
      localStorage.removeItem("parentChildren")
      router.push("/")
    }
  }


  const handleAddChild = async () => {
    if (!studentNumber.trim()) {
      setAddError("Please enter a student number")
      return
    }

    setIsAddingChild(true)
    setAddError("")

    try {
      const response = await fetch("/api/parent/link-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent_id: parent.id,
          student_number: studentNumber.trim(),
          relationship_type: relationshipType,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setAddError(data.error || "Failed to add student")
        return
      }

      // Add the new student to the children list
      const newChild = {
        id: data.student.id,
        name: data.student.name,
        student_id: data.student.student_number,
        grade_level: data.student.grade_level,
        section: data.student.section,
        email: data.student.email,
      }

      const updatedChildren = [...children, newChild]
      setChildren(updatedChildren)
      localStorage.setItem("parentChildren", JSON.stringify(updatedChildren))

      if (updatedChildren.length === 1) {
        setSelectedChild(newChild)
      }

      // Reset form
      setStudentNumber("")
      setRelationshipType("parent")
      setShowAddDialog(false)

      showAlert({ message: "Student added successfully!", type: "success" })
    } catch (error) {
      console.error("Error adding student:", error)
      setAddError("Failed to add student. Please try again.")
    } finally {
      setIsAddingChild(false)
    }
  }

  const handleViewStudentPage = (child: Child) => {
    // Store child data temporarily and redirect to student page
    localStorage.setItem("student", JSON.stringify(child))
    window.open(`/student?parentView=true`, "_blank")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!parent || children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Children Found</CardTitle>
            <CardDescription>
              You don't have any children linked to your account. Please contact the school administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
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
                <h1 className="text-xl font-bold text-red-800">Parent/Guardian Portal</h1>
                <p className="text-sm text-gray-600">Sto Niño de Praga Academy</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white bg-transparent"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Child
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Your Child</DialogTitle>
                    <DialogDescription>
                      Enter your child's student number to link them to your account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="studentNumber">Student Number</Label>
                      <Input
                        id="studentNumber"
                        placeholder="e.g., SNPA-2024-001"
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        disabled={isAddingChild}
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationship">Relationship</Label>
                      <Select value={relationshipType} onValueChange={setRelationshipType} disabled={isAddingChild}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
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
                        {isAddingChild ? "Adding..." : "Add Student"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddDialog(false)
                          setStudentNumber("")
                          setAddError("")
                        }}
                        disabled={isAddingChild}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white bg-transparent"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="text-right">
                <p className="font-medium text-red-800">{parent.name || parent.email || "Parent/Guardian"}</p>
                <p className="text-sm text-gray-600">Parent/Guardian</p>
              </div>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="children" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              My Children
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome, {parent.name || parent.email || "Parent/Guardian"}!
              </h2>
              <p className="text-gray-600">Monitor your children's academic progress and school activities.</p>
            </div>

            {/* Integrated Dashboard Component */}
            <ParentDashboard
              children={children}
              childStats={childStats}
              childGrades={childGrades}
              childAttendance={childAttendance}
              announcements={announcements}
            />
          </TabsContent>

          {/* My Children Tab */}
          <TabsContent value="children" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">My Children</h2>
              <p className="text-gray-600">View and access your children's student portals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map((child) => (
                <Card key={child.id} className="border-red-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {child.photo || child.name?.charAt(0) || "S"}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-red-800">{child.name}</CardTitle>
                        <CardDescription>
                          {child.grade_level || "N/A"} - {child.section || "N/A"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Student ID</p>
                        <p className="font-medium">{child.student_id || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-sm">{child.email || "N/A"}</p>
                      </div>
                      <Button
                        onClick={() => handleViewStudentPage(child)}
                        className="w-full bg-red-800 hover:bg-red-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Student Portal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Attendance Records</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((child) => (
                <Card key={child.id}>
                  <CardHeader>
                    <CardTitle className="text-red-800">{child.name}</CardTitle>
                    <CardDescription>
                      {child.grade_level || "N/A"} - {child.section || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Overall Attendance</span>
                          <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                        <Progress value={0} className="h-2" />
                      </div>
                      <p className="text-sm text-gray-500 text-center">
                        Click "View Student Portal" to see detailed attendance records
                      </p>
                      <Button
                        onClick={() => handleViewStudentPage(child)}
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Student Portal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Messages</h2>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">Recent Messages</CardTitle>
                <CardDescription>Communications from teachers and school administration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No messages yet.</p>
                  <p className="text-sm mt-2">Messages from teachers will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Class Schedules</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {children.map((child) => (
                <Card key={child.id}>
                  <CardHeader>
                    <CardTitle className="text-red-800">{child.name}'s Schedule</CardTitle>
                    <CardDescription>
                      {child.grade_level || "N/A"} - {child.section || "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Schedule information available in student portal.</p>
                      <Button
                        onClick={() => handleViewStudentPage(child)}
                        variant="outline"
                        className="mt-4"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Student Portal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
