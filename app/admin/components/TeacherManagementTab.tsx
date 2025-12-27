"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TabsContent } from "@/components/ui/tabs"
import { useAlert } from "@/lib/use-alert"
import { Eye } from "lucide-react"
import { useMemo, useState } from "react"
import type { Teacher, TeacherFilters } from "../types"
import { generatePassword } from "../utils/helpers"

interface TeacherManagementTabProps {
  teachers: Teacher[]
  loadingTeachers: boolean
  onTeacherAdded: () => void
  onTeacherUpdated: (teachers: Teacher[]) => void
}

export function TeacherManagementTab({ teachers, loadingTeachers, onTeacherAdded, onTeacherUpdated }: TeacherManagementTabProps) {
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showTeacherCredentialsModal, setShowTeacherCredentialsModal] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [newTeacherCredentials, setNewTeacherCredentials] = useState<any>(null)
  const [teacherFormError, setTeacherFormError] = useState<string | null>(null)
  const { showAlert } = useAlert()
  
  const [newTeacher, setNewTeacher] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    employee_number: "",
    email: "",
    phone_number: "",
    department: "",
    specialization: "",
    date_hired: "",
  })

  const [teacherFilters, setTeacherFilters] = useState<TeacherFilters>({
    search: "",
    department: "all",
    status: "all",
  })

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const fullName = `${teacher.first_name || ''} ${teacher.middle_name || ''} ${teacher.last_name || ''}`.trim()
      const matchesSearch =
        teacherFilters.search.trim().length === 0 ||
        `${fullName} ${teacher.employee_number}`.toLowerCase().includes(teacherFilters.search.toLowerCase())
      const matchesDepartment =
        teacherFilters.department === "all" ||
        (teacher.department || "").toLowerCase() === teacherFilters.department.toLowerCase()
      const matchesStatus =
        teacherFilters.status === "all" ||
        (teacher.status || "Active").toLowerCase() === teacherFilters.status.toLowerCase()
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [teachers, teacherFilters])

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setTeacherFormError(null)

    if (!newTeacher.first_name.trim() || !newTeacher.last_name.trim()) {
      setTeacherFormError("First Name and Last Name are required.")
      return
    }

    if (!newTeacher.department.trim()) {
      setTeacherFormError("Department is required.")
      return
    }

    const timestamp = Date.now().toString().slice(-6)
    const employeeNumber = `T${timestamp}`
    const username = employeeNumber
    const password = generatePassword()
    
    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newTeacher.first_name,
          last_name: newTeacher.last_name,
          middle_name: newTeacher.middle_name || null,
          employee_number: employeeNumber,
          email: newTeacher.email,
          phone_number: newTeacher.phone_number || null,
          department: newTeacher.department,
          specialization: newTeacher.specialization || null,
          date_hired: newTeacher.date_hired || null,
          password: password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNewTeacherCredentials({
          employee_number: employeeNumber,
          username: username,
          password: password,
          first_name: newTeacher.first_name,
          last_name: newTeacher.last_name,
        })
        setShowAddTeacher(false)
        setShowTeacherCredentialsModal(true)
        setNewTeacher({
          first_name: "",
          last_name: "",
          middle_name: "",
          employee_number: "",
          email: "",
          phone_number: "",
          department: "",
          specialization: "",
          date_hired: "",
        })
        setTeacherFormError(null)
        onTeacherAdded()
      } else {
        showAlert({ message: data.error || "Failed to add teacher. Please try again.", type: "error" })
      }
    } catch (error) {
      console.error("Add teacher error:", error)
      showAlert({ message: "Error adding teacher. Please try again.", type: "error" })
    }
  }

  const handleTeacherStatusChange = (teacherId: string, statusValue: string) => {
    const formattedStatus = statusValue.charAt(0).toUpperCase() + statusValue.slice(1)
    const updated = teachers.map((teacher) => 
      teacher.id === teacherId ? { ...teacher, status: formattedStatus } : teacher
    )
    onTeacherUpdated(updated)
  }

  const departments = ["All Departments", "Math", "Science", "English", "Filipino", "Social Studies", "PE", "MAPEH", "TLE"]
  const teacherStatusOptions = ["Active", "Inactive", "On Leave"]

  return (
    <TabsContent value="teachers" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-800">Teacher Management</CardTitle>
          <CardDescription>Manage teacher records, departments, and faculty information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Teacher Records</h4>
              <Dialog open={showAddTeacher} onOpenChange={setShowAddTeacher}>
                <DialogTrigger asChild>
                  <Button className="bg-red-800 hover:bg-red-700">Add New Teacher</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-red-800">Add New Teacher</DialogTitle>
                    <DialogDescription>Enter the teacher's information</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddTeacher} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teacherFirstName">First Name *</Label>
                        <Input
                          id="teacherFirstName"
                          value={newTeacher.first_name}
                          onChange={(e) => setNewTeacher({ ...newTeacher, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="teacherLastName">Last Name *</Label>
                        <Input
                          id="teacherLastName"
                          value={newTeacher.last_name}
                          onChange={(e) => setNewTeacher({ ...newTeacher, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="teacherMiddleName">Middle Name</Label>
                      <Input
                        id="teacherMiddleName"
                        value={newTeacher.middle_name}
                        onChange={(e) => setNewTeacher({ ...newTeacher, middle_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacherDepartment">Department *</Label>
                      <Select
                        value={newTeacher.department}
                        onValueChange={(value) => setNewTeacher({ ...newTeacher, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.slice(1).map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={newTeacher.specialization}
                        onChange={(e) => setNewTeacher({ ...newTeacher, specialization: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacherEmail">Email</Label>
                      <Input
                        id="teacherEmail"
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacherPhone">Phone Number</Label>
                      <Input
                        id="teacherPhone"
                        type="tel"
                        value={newTeacher.phone_number}
                        onChange={(e) => setNewTeacher({ ...newTeacher, phone_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateHired">Date Hired</Label>
                      <Input
                        id="dateHired"
                        type="date"
                        value={newTeacher.date_hired}
                        onChange={(e) => setNewTeacher({ ...newTeacher, date_hired: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      {teacherFormError && (
                        <p className="text-sm text-red-600 flex-1">{teacherFormError}</p>
                      )}
                      <Button type="button" variant="outline" onClick={() => setShowAddTeacher(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-red-800 hover:bg-red-700">
                        Add Teacher
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Credentials Modal */}
              <Dialog open={showTeacherCredentialsModal} onOpenChange={setShowTeacherCredentialsModal}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-red-800">Teacher Registration Successful</DialogTitle>
                    <DialogDescription>
                      Please provide these login credentials to the teacher.
                    </DialogDescription>
                  </DialogHeader>
                  {newTeacherCredentials && (
                    <div className="space-y-4 py-4">
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <Label className="text-sm text-gray-600">Teacher Name</Label>
                          <p className="font-semibold text-lg">{newTeacherCredentials.first_name} {newTeacherCredentials.last_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Employee ID / Username</Label>
                          <p className="font-mono font-semibold text-lg bg-white p-2 rounded border">{newTeacherCredentials.username}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Temporary Password</Label>
                          <p className="font-mono font-semibold text-lg bg-white p-2 rounded border text-red-600">{newTeacherCredentials.password}</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => setShowTeacherCredentialsModal(false)}>Close</Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="teacherSearch">Search</Label>
                <Input
                  id="teacherSearch"
                  placeholder="Search by name or employee ID..."
                  value={teacherFilters.search}
                  onChange={(e) => setTeacherFilters({ ...teacherFilters, search: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="departmentFilter">Department</Label>
                <Select
                  value={teacherFilters.department}
                  onValueChange={(value) => setTeacherFilters({ ...teacherFilters, department: value })}
                >
                  <SelectTrigger id="departmentFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.slice(1).map((dept) => (
                      <SelectItem key={dept.toLowerCase()} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="teacherStatusFilter">Status</Label>
                <Select
                  value={teacherFilters.status}
                  onValueChange={(value) => setTeacherFilters({ ...teacherFilters, status: value })}
                >
                  <SelectTrigger id="teacherStatusFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {teacherStatusOptions.map((status) => (
                      <SelectItem key={status.toLowerCase()} value={status.toLowerCase()}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Teachers Table */}
            <div className="border rounded-lg">
              {loadingTeachers ? (
                <div className="p-8 text-center text-gray-500">Loading teachers...</div>
              ) : filteredTeachers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {teachers.length === 0 ? "No teachers found. Add your first teacher!" : "No teachers match your filters."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>RFID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">
                          {`${teacher.first_name} ${teacher.middle_name ? teacher.middle_name + ' ' : ''}${teacher.last_name}`}
                        </TableCell>
                        <TableCell>{teacher.employee_number || 'N/A'}</TableCell>
                        <TableCell>{teacher.email || 'N/A'}</TableCell>
                        <TableCell>{teacher.department || 'N/A'}</TableCell>
                        <TableCell>{teacher.specialization || 'N/A'}</TableCell>
                        <TableCell>
                          {teacher.rfid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Assigned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600">
                              Not Assigned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={(teacher.status || "Active").toLowerCase()}
                            onValueChange={(value) => handleTeacherStatusChange(teacher.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {teacherStatusOptions.map((status) => (
                                <SelectItem key={status.toLowerCase()} value={status.toLowerCase()}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedTeacher(teacher)
                                setShowViewSheet(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Teacher Sheet */}
      <Sheet open={showViewSheet} onOpenChange={setShowViewSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-red-800">Teacher Details</SheetTitle>
            <SheetDescription>View complete teacher information</SheetDescription>
          </SheetHeader>
          {selectedTeacher && (
            <div className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                  <p className="text-base font-semibold">
                    {`${selectedTeacher.first_name} ${selectedTeacher.middle_name ? selectedTeacher.middle_name + ' ' : ''}${selectedTeacher.last_name}`.trim()}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Employee Number</h3>
                  <p className="text-base font-mono">{selectedTeacher.employee_number || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-base">{selectedTeacher.email || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                  <p className="text-base">{selectedTeacher.phone_number || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                  <p className="text-base">{selectedTeacher.department || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Specialization</h3>
                  <p className="text-base">{selectedTeacher.specialization || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date Hired</h3>
                  <p className="text-base">
                    {selectedTeacher.date_hired 
                      ? new Date(selectedTeacher.date_hired).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">RFID Status</h3>
                  {selectedTeacher.rfid ? (
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Assigned
                      </Badge>
                      <p className="text-sm text-gray-600 font-mono">{selectedTeacher.rfid}</p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600">
                      Not Assigned
                    </Badge>
                  )}
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <Badge className={
                    (selectedTeacher.status || "Active").toLowerCase() === "active" 
                      ? "bg-green-100 text-green-800" 
                      : (selectedTeacher.status || "").toLowerCase() === "on leave"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }>
                    {selectedTeacher.status || "Active"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </TabsContent>
  )
}
