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

interface Teacher {
  id: string
  first_name: string
  last_name: string
  middle_name?: string
  employee_number: string
  department?: string
  specialization?: string
  email: string
  phone_number?: string
  date_of_birth?: string
  date_hired?: string
  address?: string
  rfid?: string
  status: string
}

export default function TeacherManagementPage() {
  const { admin, loading: authLoading } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const { showAlert } = useAlert()
  const { showConfirm } = useConfirm()
  const [newTeacher, setNewTeacher] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    employee_number: "",
    department: "",
    specialization: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    date_hired: "",
    address: "",
    rfid: "",
  })
  const [editTeacher, setEditTeacher] = useState({
    id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    employee_number: "",
    department: "",
    specialization: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    date_hired: "",
    address: "",
    rfid: "",
  })
  const [addingTeacher, setAddingTeacher] = useState(false)
  const [updatingTeacher, setUpdatingTeacher] = useState(false)
  const [deletingTeacher, setDeletingTeacher] = useState(false)
  const [addError, setAddError] = useState("")
  const [editError, setEditError] = useState("")

  const fetchTeachers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/teachers")
      const result = await response.json()
      if (result.success && result.teachers) {
        setTeachers(result.teachers)
      }
    } catch (error) {
      console.error("Error fetching teachers:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name} ${teacher.employee_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingTeacher(true)
    setAddError("")

    try {
      const tempPassword = `Teacher${Math.random().toString(36).slice(-8)}${Math.floor(Math.random() * 100)}`

      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTeacher, password: tempPassword }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to add teacher")

      await fetchTeachers()
      setNewTeacher({
        first_name: "",
        last_name: "",
        middle_name: "",
        employee_number: "",
        department: "",
        specialization: "",
        email: "",
        phone_number: "",
        date_of_birth: "",
        date_hired: "",
        address: "",
        rfid: "",
      })
      setShowAddDialog(false)

      showAlert({
        message: `Teacher added successfully!\n\nLogin Credentials:\nEmail: ${newTeacher.email}\nPassword: ${tempPassword}\n\nPlease save these credentials!`,
        type: "success"
      })
    } catch (error: any) {
      setAddError(error?.message || "Failed to add teacher.")
    } finally {
      setAddingTeacher(false)
    }
  }

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingTeacher(true)
    setEditError("")

    try {
      const response = await fetch(`/api/admin/teachers/${editTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTeacher),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to update teacher")

      await fetchTeachers()
      setShowEditDialog(false)
      showAlert({ message: "Teacher updated successfully!", type: "success" })
    } catch (error: any) {
      setEditError(error?.message || "Failed to update teacher.")
    } finally {
      setUpdatingTeacher(false)
    }
  }

  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    const confirmed = await showConfirm({
      message: `Are you sure you want to delete ${teacherName}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (!confirmed) return

    setDeletingTeacher(true)
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, { method: "DELETE" })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to delete teacher")

      await fetchTeachers()
      showAlert({ message: "Teacher deleted successfully!", type: "success" })
    } catch (error: any) {
      showAlert({ message: error?.message || "Failed to delete teacher.", type: "error" })
    } finally {
      setDeletingTeacher(false)
    }
  }

  const openEditDialog = (teacher: Teacher) => {
    setEditTeacher({
      id: teacher.id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      middle_name: teacher.middle_name || "",
      employee_number: teacher.employee_number,
      department: teacher.department || "",
      specialization: teacher.specialization || "",
      email: teacher.email,
      phone_number: teacher.phone_number || "",
      date_of_birth: teacher.date_of_birth || "",
      date_hired: teacher.date_hired || "",
      address: teacher.address || "",
      rfid: teacher.rfid || "",
    })
    setShowEditDialog(true)
  }

  const openViewSheet = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
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
            <h2 className="text-3xl font-bold text-red-800">Teacher Management</h2>
            <p className="text-gray-600 mt-1">Manage teacher records and information</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-800 hover:bg-red-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-red-800">Add New Teacher</DialogTitle>
                <DialogDescription>Enter teacher information to create a new account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={newTeacher.first_name} onChange={(e) => setNewTeacher({ ...newTeacher, first_name: e.target.value })} placeholder="Enter first name" required />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={newTeacher.last_name} onChange={(e) => setNewTeacher({ ...newTeacher, last_name: e.target.value })} placeholder="Enter last name" required />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input value={newTeacher.middle_name} onChange={(e) => setNewTeacher({ ...newTeacher, middle_name: e.target.value })} placeholder="Enter middle name" />
                  </div>
                  <div>
                    <Label>Employee Number *</Label>
                    <Input value={newTeacher.employee_number} onChange={(e) => setNewTeacher({ ...newTeacher, employee_number: e.target.value })} placeholder="Enter employee number" required />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select value={newTeacher.department} onValueChange={(value) => setNewTeacher({ ...newTeacher, department: value })}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Filipino">Filipino</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                        <SelectItem value="ESP">ESP</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="MAPEH">MAPEH</SelectItem>
                        <SelectItem value="EPP">EPP</SelectItem>
                        <SelectItem value="TLE">TLE</SelectItem>
                        <SelectItem value="ELECTIVE">ELECTIVE</SelectItem>
                        <SelectItem value="WRITING">WRITING</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Specialization</Label>
                    <Input value={newTeacher.specialization} onChange={(e) => setNewTeacher({ ...newTeacher, specialization: e.target.value })} placeholder="e.g., Algebra, Physics" />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} placeholder="Enter email address" required />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input value={newTeacher.phone_number} onChange={(e) => setNewTeacher({ ...newTeacher, phone_number: e.target.value })} placeholder="Enter phone number" />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input type="date" value={newTeacher.date_of_birth} onChange={(e) => setNewTeacher({ ...newTeacher, date_of_birth: e.target.value })} />
                  </div>
                  <div>
                    <Label>Date Hired</Label>
                    <Input type="date" value={newTeacher.date_hired} onChange={(e) => setNewTeacher({ ...newTeacher, date_hired: e.target.value })} />
                  </div>
                  <div>
                    <Label>RFID Card Number</Label>
                    <Input 
                      value={newTeacher.rfid} 
                      onChange={(e) => setNewTeacher({ ...newTeacher, rfid: e.target.value })} 
                      placeholder="Enter RFID card number"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={newTeacher.address} onChange={(e) => setNewTeacher({ ...newTeacher, address: e.target.value })} placeholder="Enter complete address" />
                  </div>
                </div>
                {addError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{addError}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={addingTeacher}>Cancel</Button>
                  <Button type="submit" className="bg-red-800 hover:bg-red-700" disabled={addingTeacher}>{addingTeacher ? "Adding..." : "Add Teacher"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-800">Edit Teacher</DialogTitle>
              <DialogDescription>Update teacher information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input value={editTeacher.first_name} onChange={(e) => setEditTeacher({ ...editTeacher, first_name: e.target.value })} placeholder="Enter first name" required />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={editTeacher.last_name} onChange={(e) => setEditTeacher({ ...editTeacher, last_name: e.target.value })} placeholder="Enter last name" required />
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input value={editTeacher.middle_name} onChange={(e) => setEditTeacher({ ...editTeacher, middle_name: e.target.value })} placeholder="Enter middle name" />
                </div>
                <div>
                  <Label>Employee Number *</Label>
                  <Input value={editTeacher.employee_number} onChange={(e) => setEditTeacher({ ...editTeacher, employee_number: e.target.value })} placeholder="Enter employee number" required />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={editTeacher.department} onValueChange={(value) => setEditTeacher({ ...editTeacher, department: value })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Filipino">Filipino</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="AP">AP</SelectItem>
                      <SelectItem value="ESP">ESP</SelectItem>
                      <SelectItem value="MT">MT</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="MAPEH">MAPEH</SelectItem>
                      <SelectItem value="EPP">EPP</SelectItem>
                      <SelectItem value="TLE">TLE</SelectItem>
                      <SelectItem value="ELECTIVE">ELECTIVE</SelectItem>
                      <SelectItem value="WRITING">WRITING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Specialization</Label>
                  <Input value={editTeacher.specialization} onChange={(e) => setEditTeacher({ ...editTeacher, specialization: e.target.value })} placeholder="e.g., Algebra, Physics" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={editTeacher.email} onChange={(e) => setEditTeacher({ ...editTeacher, email: e.target.value })} placeholder="Enter email address" required />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={editTeacher.phone_number} onChange={(e) => setEditTeacher({ ...editTeacher, phone_number: e.target.value })} placeholder="Enter phone number" />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={editTeacher.date_of_birth} onChange={(e) => setEditTeacher({ ...editTeacher, date_of_birth: e.target.value })} />
                </div>
                <div>
                  <Label>Date Hired</Label>
                  <Input type="date" value={editTeacher.date_hired} onChange={(e) => setEditTeacher({ ...editTeacher, date_hired: e.target.value })} />
                </div>
                <div>
                  <Label>RFID Card Number</Label>
                  <Input 
                    value={editTeacher.rfid} 
                    onChange={(e) => setEditTeacher({ ...editTeacher, rfid: e.target.value })} 
                    placeholder="Enter RFID card number"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={editTeacher.address} onChange={(e) => setEditTeacher({ ...editTeacher, address: e.target.value })} placeholder="Enter complete address" />
                </div>
              </div>
              {editError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{editError}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={updatingTeacher}>Cancel</Button>
                <Button type="submit" className="bg-red-800 hover:bg-red-700" disabled={updatingTeacher}>{updatingTeacher ? "Updating..." : "Update Teacher"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Sheet */}
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
                    <p className="text-base font-semibold">{`${selectedTeacher.first_name} ${selectedTeacher.middle_name || ''} ${selectedTeacher.last_name}`.trim()}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Employee Number</h3>
                    <p className="text-base font-mono">{selectedTeacher.employee_number}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                    <p className="text-base">{selectedTeacher.department || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Specialization</h3>
                    <p className="text-base">{selectedTeacher.specialization || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-base">{selectedTeacher.email}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                    <p className="text-base">{selectedTeacher.phone_number || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
                    <p className="text-base">{selectedTeacher.date_of_birth || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Date Hired</h3>
                    <p className="text-base">{selectedTeacher.date_hired || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">RFID Card</h3>
                    {selectedTeacher.rfid ? (
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Assigned</Badge>
                        <p className="text-sm text-gray-600 font-mono">{selectedTeacher.rfid}</p>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600">Not Assigned</Badge>
                    )}
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <Badge className="bg-green-100 text-green-800">{selectedTeacher.status}</Badge>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                    <p className="text-base">{selectedTeacher.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800">All Teachers ({filteredTeachers.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search teachers..." className="pl-10 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading teachers...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>RFID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.length > 0 ? (
                    filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.employee_number}</TableCell>
                        <TableCell>{`${teacher.first_name} ${teacher.last_name}`}</TableCell>
                        <TableCell>{teacher.department || "N/A"}</TableCell>
                        <TableCell>{teacher.specialization || "N/A"}</TableCell>
                        <TableCell>
                          {teacher.rfid ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {teacher.rfid}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{teacher.status || "Active"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openViewSheet(teacher)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(teacher)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteTeacher(teacher.id, `${teacher.first_name} ${teacher.last_name}`)}
                              disabled={deletingTeacher}
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
                        No teachers found
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
