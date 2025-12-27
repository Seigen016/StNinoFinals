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
import type { NewStudentCredentials, Student, StudentFilters } from "../types"
import { generateNextStudentId, generatePassword, gradeOptions, studentStatusOptions } from "../utils/helpers"

interface StudentManagementTabProps {
  students: Student[]
  loadingStudents: boolean
  onStudentAdded: () => void
  onStudentUpdated: (students: Student[]) => void
}

export function StudentManagementTab({ students, loadingStudents, onStudentAdded, onStudentUpdated }: StudentManagementTabProps) {
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newStudentCredentials, setNewStudentCredentials] = useState<NewStudentCredentials | null>(null)
  const [studentFormError, setStudentFormError] = useState<string | null>(null)
  const { showAlert } = useAlert()
  
  const [newStudent, setNewStudent] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    student_number: "",
    grade_level: "",
    section: "",
    email: "",
    phone_number: "",
  })

  const [studentFilters, setStudentFilters] = useState<StudentFilters>({
    search: "",
    grade: "All Grades",
    status: "all",
  })

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const fullName = `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim()
      const matchesSearch =
        studentFilters.search.trim().length === 0 ||
        `${fullName} ${student.student_number}`.toLowerCase().includes(studentFilters.search.toLowerCase())
      const matchesGrade =
        studentFilters.grade === "All Grades" ||
        student.grade_level?.toLowerCase() === studentFilters.grade.toLowerCase()
      const matchesStatus =
        studentFilters.status === "all" ||
        (student.status || "Active").toLowerCase() === studentFilters.status.toLowerCase()
      return matchesSearch && matchesGrade && matchesStatus
    })
  }, [students, studentFilters])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setStudentFormError(null)

    if (!newStudent.first_name.trim() || !newStudent.last_name.trim() || !newStudent.section.trim()) {
      setStudentFormError("First Name, Last Name, and Section are required.")
      return
    }

    if (!newStudent.grade_level) {
      setStudentFormError("Please select a grade level.")
      return
    }

    const studentNumber = await generateNextStudentId()
    const username = studentNumber
    const password = generatePassword()
    
    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newStudent.first_name,
          last_name: newStudent.last_name,
          middle_name: newStudent.middle_name || null,
          student_number: studentNumber,
          grade_level: newStudent.grade_level,
          section: newStudent.section,
          email: newStudent.email,
          phone_number: newStudent.phone_number || null,
          password: password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNewStudentCredentials({
          student_number: studentNumber,
          username: username,
          password: password,
          first_name: newStudent.first_name,
          last_name: newStudent.last_name,
        })
        setShowAddStudent(false)
        setShowCredentialsModal(true)
        setNewStudent({
          first_name: "",
          last_name: "",
          middle_name: "",
          student_number: "",
          grade_level: "",
          section: "",
          email: "",
          phone_number: "",
        })
        setStudentFormError(null)
        onStudentAdded()
      } else {
        showAlert({ message: data.error || "Failed to add student. Please try again.", type: "error" })
      }
    } catch (error) {
      console.error("Add student error:", error)
      showAlert({ message: "Error adding student. Please try again.", type: "error" })
    }
  }

  const handleStudentStatusChange = (studentId: string, statusValue: string) => {
    const formattedStatus = statusValue.charAt(0).toUpperCase() + statusValue.slice(1)
    const updated = students.map((student) => 
      student.id === studentId ? { ...student, status: formattedStatus } : student
    )
    onStudentUpdated(updated)
  }

  return (
    <TabsContent value="students" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-800">Student Management</CardTitle>
          <CardDescription>Manage student records, enrollment, and academic information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Student Records</h4>
              <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogTrigger asChild>
                  <Button className="bg-red-800 hover:bg-red-700">Add New Student</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-red-800">Add New Student</DialogTitle>
                    <DialogDescription>Enter the student's information</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={newStudent.first_name}
                          onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={newStudent.last_name}
                          onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={newStudent.middle_name}
                        onChange={(e) => setNewStudent({ ...newStudent, middle_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gradeLevel">Grade Level *</Label>
                      <Select value={newStudent.grade_level} onValueChange={(value) => setNewStudent({ ...newStudent, grade_level: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade level" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeOptions.slice(1).map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="section">Section *</Label>
                      <Input
                        id="section"
                        value={newStudent.section}
                        onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newStudent.phone_number}
                        onChange={(e) => setNewStudent({ ...newStudent, phone_number: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      {studentFormError && (
                        <p className="text-sm text-red-600 flex-1">{studentFormError}</p>
                      )}
                      <Button type="button" variant="outline" onClick={() => setShowAddStudent(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-red-800 hover:bg-red-700">
                        Add Student
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Credentials Modal */}
              <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-red-800">Student Registration Successful</DialogTitle>
                    <DialogDescription>
                      Please provide these login credentials to the student.
                    </DialogDescription>
                  </DialogHeader>
                  {newStudentCredentials && (
                    <div className="space-y-4 py-4">
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <Label className="text-sm text-gray-600">Student Name</Label>
                          <p className="font-semibold text-lg">{newStudentCredentials.first_name} {newStudentCredentials.last_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Student ID / Username</Label>
                          <p className="font-mono font-semibold text-lg bg-white p-2 rounded border">{newStudentCredentials.username}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600">Temporary Password</Label>
                          <p className="font-mono font-semibold text-lg bg-white p-2 rounded border text-red-600">{newStudentCredentials.password}</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => setShowCredentialsModal(false)}>Close</Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name or student ID..."
                  value={studentFilters.search}
                  onChange={(e) => setStudentFilters({ ...studentFilters, search: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gradeFilter">Grade Level</Label>
                <Select
                  value={studentFilters.grade}
                  onValueChange={(value) => setStudentFilters({ ...studentFilters, grade: value })}
                >
                  <SelectTrigger id="gradeFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statusFilter">Status</Label>
                <Select
                  value={studentFilters.status}
                  onValueChange={(value) => setStudentFilters({ ...studentFilters, status: value })}
                >
                  <SelectTrigger id="statusFilter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {studentStatusOptions.map((status) => (
                      <SelectItem key={status.toLowerCase()} value={status.toLowerCase()}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Students Table */}
            <div className="border rounded-lg">
              {loadingStudents ? (
                <div className="p-8 text-center text-gray-500">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {students.length === 0 ? "No students found. Add your first student!" : "No students match your filters."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>RFID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {`${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`}
                        </TableCell>
                        <TableCell>{student.student_number || 'N/A'}</TableCell>
                        <TableCell>{student.grade_level || 'N/A'}</TableCell>
                        <TableCell>{student.section || 'N/A'}</TableCell>
                        <TableCell>
                          {student.rfid ? (
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
                            value={(student.status || "Active").toLowerCase()}
                            onValueChange={(value) => handleStudentStatusChange(student.id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {studentStatusOptions.map((status) => (
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
                                setSelectedStudent(student)
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
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Student Sheet */}
      <Sheet open={showViewSheet} onOpenChange={setShowViewSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-red-800">Student Details</SheetTitle>
            <SheetDescription>View complete student information</SheetDescription>
          </SheetHeader>
          {selectedStudent && (
            <div className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                  <p className="text-base font-semibold">
                    {`${selectedStudent.first_name} ${selectedStudent.middle_name ? selectedStudent.middle_name + ' ' : ''}${selectedStudent.last_name}`.trim()}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Student Number</h3>
                  <p className="text-base font-mono">{selectedStudent.student_number || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Grade Level</h3>
                  <p className="text-base">{selectedStudent.grade_level || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Section</h3>
                  <p className="text-base">{selectedStudent.section || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                  <p className="text-base">{selectedStudent.email || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                  <p className="text-base">{selectedStudent.phone_number || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">RFID Status</h3>
                  {selectedStudent.rfid ? (
                    <div className="space-y-1">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Assigned
                      </Badge>
                      <p className="text-sm text-gray-600 font-mono">{selectedStudent.rfid}</p>
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
                    (selectedStudent.status || "Active").toLowerCase() === "active" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }>
                    {selectedStudent.status || "Active"}
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
