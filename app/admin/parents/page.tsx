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
import { ArrowLeft, Edit, Eye, Search, Trash2, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AdminHeader } from "../components/AdminHeader"
import { useAuth } from "../hooks/useAuth"

interface Parent {
  id: string
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  phone_number?: string
  address?: string
  status: string
  children?: Array<{
    id: string
    name: string
    relationship_type: string
  }>
}

interface Student {
  id: string
  first_name: string
  last_name: string
  student_number: string
  grade_level: string
}

export default function ParentManagementPage() {
  const { admin, loading: authLoading } = useAuth()
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewSheet, setShowViewSheet] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const { showAlert } = useAlert()
  const { showConfirm } = useConfirm()
  const [newParent, setNewParent] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone_number: "",
    address: "",
  })
  const [editParent, setEditParent] = useState({
    id: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone_number: "",
    address: "",
  })
  const [linkData, setLinkData] = useState({
    parent_id: "",
    student_id: "",
    relationship_type: "parent",
    is_primary: true,
  })
  const [addingParent, setAddingParent] = useState(false)
  const [updatingParent, setUpdatingParent] = useState(false)
  const [deletingParent, setDeletingParent] = useState(false)
  const [linkingStudent, setLinkingStudent] = useState(false)
  const [addError, setAddError] = useState("")
  const [editError, setEditError] = useState("")
  const [linkError, setLinkError] = useState("")

  const fetchParents = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/parents")
      const result = await response.json()
      if (result.success && result.parents) {
        setParents(result.parents)
      }
    } catch (error) {
      console.error("Error fetching parents:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/students")
      const result = await response.json()
      if (result.success && result.students) {
        setStudents(result.students)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  useEffect(() => {
    fetchParents()
    fetchStudents()
  }, [])

  const filteredParents = parents.filter((parent) =>
    `${parent.first_name} ${parent.last_name} ${parent.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingParent(true)
    setAddError("")

    try {
      const tempPassword = `Parent${Math.random().toString(36).slice(-8)}${Math.floor(Math.random() * 100)}`

      const response = await fetch("/api/admin/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newParent, password: tempPassword }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to add parent")

      await fetchParents()
      setNewParent({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        phone_number: "",
        address: "",
      })
      setShowAddDialog(false)

      showAlert({
        message: `Parent added successfully!\n\nLogin Credentials:\nEmail: ${newParent.email}\nPassword: ${tempPassword}\n\nPlease save these credentials!`,
        type: "success"
      })
    } catch (error: any) {
      setAddError(error?.message || "Failed to add parent.")
    } finally {
      setAddingParent(false)
    }
  }

  const handleEditParent = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingParent(true)
    setEditError("")

    try {
      const response = await fetch(`/api/admin/parents/${editParent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editParent),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to update parent")

      await fetchParents()
      setShowEditDialog(false)
      showAlert({ message: "Parent updated successfully!", type: "success" })
    } catch (error: any) {
      setEditError(error?.message || "Failed to update parent.")
    } finally {
      setUpdatingParent(false)
    }
  }

  const handleDeleteParent = async (parentId: string, parentName: string) => {
    const confirmed = await showConfirm({
      message: `Are you sure you want to delete ${parentName}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (!confirmed) return
    
    setDeletingParent(true)
    try {
      const response = await fetch(`/api/admin/parents/${parentId}`, { method: "DELETE" })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to delete parent")

      await fetchParents()
      showAlert({ message: "Parent deleted successfully!", type: "success" })
    } catch (error: any) {
      showAlert({ message: error?.message || "Failed to delete parent.", type: "error" })
    } finally {
      setDeletingParent(false)
    }
  }

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLinkingStudent(true)
    setLinkError("")

    try {
      const response = await fetch("/api/admin/parents/link-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || "Failed to link student")

      await fetchParents()
      setShowLinkDialog(false)
      setLinkData({
        parent_id: "",
        student_id: "",
        relationship_type: "parent",
        is_primary: true,
      })
      showAlert({ message: "Student linked successfully!", type: "success" })
    } catch (error: any) {
      setLinkError(error?.message || "Failed to link student.")
    } finally {
      setLinkingStudent(false)
    }
  }

  const openEditDialog = (parent: Parent) => {
    setEditParent({
      id: parent.id,
      first_name: parent.first_name,
      last_name: parent.last_name,
      middle_name: parent.middle_name || "",
      email: parent.email,
      phone_number: parent.phone_number || "",
      address: parent.address || "",
    })
    setShowEditDialog(true)
  }

  const openViewSheet = (parent: Parent) => {
    setSelectedParent(parent)
    setShowViewSheet(true)
  }

  const openLinkDialog = (parent: Parent) => {
    setLinkData({
      parent_id: parent.id,
      student_id: "",
      relationship_type: "parent",
      is_primary: true,
    })
    setShowLinkDialog(true)
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
            <h2 className="text-3xl font-bold text-red-800">Parent/Guardian Management</h2>
            <p className="text-gray-600 mt-1">Manage parent and guardian accounts</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-800 hover:bg-red-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Parent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-red-800">Add New Parent/Guardian</DialogTitle>
                <DialogDescription>Enter parent information to create a new account</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddParent} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input value={newParent.first_name} onChange={(e) => setNewParent({ ...newParent, first_name: e.target.value })} placeholder="Enter first name" required />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input value={newParent.last_name} onChange={(e) => setNewParent({ ...newParent, last_name: e.target.value })} placeholder="Enter last name" required />
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input value={newParent.middle_name} onChange={(e) => setNewParent({ ...newParent, middle_name: e.target.value })} placeholder="Enter middle name" />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" value={newParent.email} onChange={(e) => setNewParent({ ...newParent, email: e.target.value })} placeholder="Enter email address" required />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input value={newParent.phone_number} onChange={(e) => setNewParent({ ...newParent, phone_number: e.target.value })} placeholder="Enter phone number" required />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={newParent.address} onChange={(e) => setNewParent({ ...newParent, address: e.target.value })} placeholder="Enter complete address" />
                  </div>
                </div>
                {addError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{addError}</div>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} disabled={addingParent}>Cancel</Button>
                  <Button type="submit" className="bg-red-800 hover:bg-red-700" disabled={addingParent}>{addingParent ? "Adding..." : "Add Parent"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-800">Edit Parent/Guardian</DialogTitle>
              <DialogDescription>Update parent information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditParent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  <Input value={editParent.first_name} onChange={(e) => setEditParent({ ...editParent, first_name: e.target.value })} placeholder="Enter first name" required />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={editParent.last_name} onChange={(e) => setEditParent({ ...editParent, last_name: e.target.value })} placeholder="Enter last name" required />
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input value={editParent.middle_name} onChange={(e) => setEditParent({ ...editParent, middle_name: e.target.value })} placeholder="Enter middle name" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={editParent.email} onChange={(e) => setEditParent({ ...editParent, email: e.target.value })} placeholder="Enter email address" required />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={editParent.phone_number} onChange={(e) => setEditParent({ ...editParent, phone_number: e.target.value })} placeholder="Enter phone number" />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={editParent.address} onChange={(e) => setEditParent({ ...editParent, address: e.target.value })} placeholder="Enter complete address" />
                </div>
              </div>
              {editError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{editError}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={updatingParent}>Cancel</Button>
                <Button type="submit" className="bg-red-800 hover:bg-red-700" disabled={updatingParent}>{updatingParent ? "Updating..." : "Update Parent"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Sheet */}
        <Sheet open={showViewSheet} onOpenChange={setShowViewSheet}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-red-800">Parent/Guardian Details</SheetTitle>
              <SheetDescription>View complete parent/guardian information</SheetDescription>
            </SheetHeader>
            {selectedParent && (
              <div className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                    <p className="text-base font-semibold">{`${selectedParent.first_name} ${selectedParent.middle_name || ''} ${selectedParent.last_name}`.trim()}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                    <p className="text-base">{selectedParent.email}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h3>
                    <p className="text-base">{selectedParent.phone_number || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                    <p className="text-base">{selectedParent.address || "N/A"}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <Badge className="bg-green-100 text-green-800">{selectedParent.status}</Badge>
                  </div>
                </div>
                {selectedParent.children && selectedParent.children.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Children/Wards</h3>
                    <div className="space-y-2">
                      {selectedParent.children.map((child) => (
                        <div key={child.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors">
                          <span className="font-medium">{child.name}</span>
                          <Badge variant="outline" className="bg-white">{child.relationship_type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Link Student Dialog */}
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-800">Link Student to Parent</DialogTitle>
              <DialogDescription>Associate a student with this parent/guardian</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <Label>Select Student *</Label>
                <Select value={linkData.student_id} onValueChange={(value) => setLinkData({ ...linkData, student_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} - {student.student_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Relationship *</Label>
                <Select value={linkData.relationship_type} onValueChange={(value) => setLinkData({ ...linkData, relationship_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="aunt">Aunt</SelectItem>
                    <SelectItem value="uncle">Uncle</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={linkData.is_primary}
                  onChange={(e) => setLinkData({ ...linkData, is_primary: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_primary">Primary Contact</Label>
              </div>
              {linkError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{linkError}</div>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowLinkDialog(false)} disabled={linkingStudent}>Cancel</Button>
                <Button type="submit" className="bg-red-800 hover:bg-red-700" disabled={linkingStudent}>{linkingStudent ? "Linking..." : "Link Student"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-800">All Parents ({filteredParents.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input placeholder="Search parents..." className="pl-10 w-64" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-800 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading parents...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParents.length > 0 ? (
                    filteredParents.map((parent) => (
                      <TableRow key={parent.id}>
                        <TableCell className="font-medium">{`${parent.first_name} ${parent.last_name}`}</TableCell>
                        <TableCell>{parent.email}</TableCell>
                        <TableCell>{parent.phone_number || "N/A"}</TableCell>
                        <TableCell>
                          {parent.children && parent.children.length > 0 ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {parent.children.length} {parent.children.length === 1 ? 'child' : 'children'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">No children linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">{parent.status || "Active"}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openViewSheet(parent)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openLinkDialog(parent)}>
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(parent)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteParent(parent.id, `${parent.first_name} ${parent.last_name}`)}
                              disabled={deletingParent}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No parents found
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
