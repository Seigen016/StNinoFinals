"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { useAlert } from "@/lib/use-alert"
import { useConfirm } from "@/lib/use-confirm"
import { ArrowLeft, Edit, Eye, Search, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AdminHeader } from "../components/AdminHeader"
import { useAuth } from "../hooks/useAuth"

interface Student {
  id: string
  first_name: string
  last_name: string
  middle_name?: string
  student_number: string
  grade_level: string
  section: string
  email: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  rfid?: string
  status: string
}

export default function StudentManagementPage() {
  const { admin, loading: authLoading } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const { showAlert } = useAlert()
  const { showConfirm } = useConfirm()
  const [newStudent, setNewStudent] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    student_number: "",
    grade_level: "",
    section: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    address: "",
    rfid: "",
  })
  const [editStudent, setEditStudent] = useState({
    id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    student_number: "",
    grade_level: "",
    section: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    address: "",
    rfid: "",
  })
  const [addingStudent, setAddingStudent] = useState(false)
  const [updatingStudent, setUpdatingStudent] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState(false)
  const [addError, setAddError] = useState("")
  const [editError, setEditError] = useState("")

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/students")
      const result = await response.json()
      if (result.success && result.students) {
        setStudents(result.students)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.student_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingStudent(true)
    setAddError("")

    try {
      const tempPassword = `Student${Math.random().toString(36).slice(-8)}${Math.floor(Math.random() * 100)}`

      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newStudent, password: tempPassword }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to add student")

      await fetchStudents()
      setNewStudent({
        first_name: "",
        last_name: "",
        middle_name: "",
        student_number: "",
        grade_level: "",
        section: "",
        email: "",
        phone_number: "",
        date_of_birth: "",
        address: "",
        rfid: "",
      })
      setShowAddDialog(false)

      showAlert({
        message: `Student added successfully!\n\nLogin Credentials:\nEmail: ${newStudent.email}\nPassword: ${tempPassword}\n\nPlease save these credentials!`,
        type: "success"
      })
    } catch (error: any) {
      setAddError(error?.message || "Failed to add student.")
    } finally {
      setAddingStudent(false)
    }
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingStudent(true)
    setEditError("")

    try {
      const response = await fetch(`/api/admin/students/${editStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStudent),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to update student")

      await fetchStudents()
      setShowEditDialog(false)
      showAlert({ message: "Student updated successfully!", type: "success" })
    } catch (error: any) {
      setEditError(error?.message || "Failed to update student.")
    } finally {
      setUpdatingStudent(false)
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const confirmed = await showConfirm({
      message: `Are you sure you want to delete ${studentName}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (!confirmed) return

    setDeletingStudent(true)
    try {
      const response = await fetch(`/api/admin/students/${studentId}`, { method: "DELETE" })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to delete student")

      await fetchStudents()
      showAlert({ message: "Student deleted successfully!", type: "success" })
    } catch (error: any) {
      showAlert({ message: error?.message || "Failed to delete student.", type: "error" })
    } finally {
      setDeletingStudent(false)
    }
  }

  const openEditDialog = (student: Student) => {
    setEditStudent({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || "",
      student_number: student.student_number,
      grade_level: student.grade_level,
      section: student.section || "",
      email: student.email,
      phone_number: student.phone_number || "",
      date_of_birth: student.date_of_birth || "",
      address: student.address || "",
      rfid: student.rfid || "",
    })
    setShowEditDialog(true)
  }

  const openViewSheet = (student: Student) => {
    setSelectedStudent(student)
    setShowViewSheet(true)
  }

  if (authLoading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
          <p className="mt-4 text-red-800 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50">
      <AdminHeader admin={admin} />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="hover:bg-red-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-red-800">Student Management</h2>
            <p className="text-gray-600 mt-1">Manage student records and information</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-800 hover:bg-red-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-red-800">Add New Student</DialogTitle>
                <DialogDescription>Enter student information to create a new account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={newStudent.first_name} onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={newStudent.last_name} onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input value={newStudent.middle_name} onChange={(e) => setNewStudent({ ...newStudent, middle_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Student Number *</Label>
                    <Input value={newStudent.student_number} onChange={(e) => setNewStudent({ ...newStudent, student_number: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Grade Level *</Label>
                    <Select value={newStudent.grade_level} onValueChange={(value) => setNewStudent({ ...newStudent, grade_level: value })}>
                      <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Section</Label>
                    <Input value={newStudent.section} onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={newStudent.phone_number} onChange={(e) => setNewStudent({ ...newStudent, phone_number: e.target.value })} />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={newStudent.date_of_birth} onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })} />
                  </div>
                  <div>
                    <Label>RFID Card Number</Label>
                    <Input 
                      value={newStudent.rfid} 
                      onChange={(e) => setNewStudent({ ...newStudent, rfid: e.target.value })} 
                      placeholder="Enter RFID card number"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={newStudent.address} onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })} />
                  </div>
                </div>
                {addError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{addError}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={addingStudent}>Cancel</Button>
                  <Button type="submit" className="bg-red-800 hover:bg-red-700" disabled={addingStudent}>{addingStudent ? "Adding..." : "Add Student"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-800">Edit Student</DialogTitle>
              <DialogDescription>Update student information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input value={editStudent.first_name} onChange={(e) => setEditStudent({ ...editStudent, first_name: e.target.value })} required />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={editStudent.last_name} onChange={(e) => setEditStudent({ ...editStudent, last_name: e.target.value })} required />
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input value={editStudent.middle_name} onChange={(e) => setEditStudent({ ...editStudent, middle_name: e.target.value })} />
                </div>
                <div>
                  <Label>Student Number *</Label>
                  <Input value={editStudent.student_number} onChange={(e) => setEditStudent({ ...editStudent, student_number: e.target.value })} required />
                </div>
                <div>
                  <Label>Grade Level *</Label>
                  <Select value={editStudent.grade_level} onValueChange={(value) => setEditStudent({ ...editStudent, grade_level: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section</Label>
                  <Input value={editStudent.section} onChange={(e) => setEditStudent({ ...editStudent, section: e.target.value })} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={editStudent.email} onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })} required />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={editStudent.phone_number} onChange={(e) => setEditStudent({ ...editStudent, phone_number: e.target.value })} />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={editStudent.date_of_birth} onChange={(e) => setEditStudent({ ...editStudent, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <Label>RFID Card Number</Label>
                  <Input 
                    value={editStudent.rfid} 
                    onChange={(e) => setEditStudent({ ...editStudent, rfid: e.target.value })} 
                    placeholder="Enter RFID card number"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={editStudent.address} onChange={(e) => setEditStudent({ ...editStudent, address: e.target.value })} />
                </div>
              </div>
              {editError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{editError}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={updatingStudent}>Cancel</Button>
                <Button type="submit" className="bg-red-800 hover:bg-red-700" disabled={updatingStudent}>{updatingStudent ? "Updating..." : "Update Student"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Sheet */}
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
                    <p className="text-base font-semibold">{`${selectedStudent.first_name} ${selectedStudent.middle_name || ''} ${selectedStudent.last_name}`.trim()}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Student Number</h3>
                    <p className="text-base font-mono">{selectedStudent.student_number}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Grade Level</h3>
                    <p className="text-base">{selectedStudent.grade_level}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Section</h3>
                    <p className="text-base">{selectedStudent.section || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-base">{selectedStudent.email}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                    <p className="text-base">{selectedStudent.phone_number || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
                    <p className="text-base">{selectedStudent.date_of_birth || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">RFID Card</h3>
                    {selectedStudent.rfid ? (
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Assigned</Badge>
                        <p className="text-sm text-gray-600 font-mono">{selectedStudent.rfid}</p>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600">Not Assigned</Badge>
                    )}
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <Badge className="bg-green-100 text-green-800">{selectedStudent.status}</Badge>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                    <p className="text-base">{selectedStudent.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800">All Students ({filteredStudents.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search students..." className="pl-10 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading students...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>RFID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_number}</TableCell>
                        <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                        <TableCell>{student.grade_level}</TableCell>
                        <TableCell>{student.section || "N/A"}</TableCell>
                        <TableCell>
                          {student.rfid ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {student.rfid}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{student.status || "Active"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openViewSheet(student)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(student)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteStudent(student.id, `${student.first_name} ${student.last_name}`)}
                              disabled={deletingStudent}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
