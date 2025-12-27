export const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export const generateNextStudentId = async (): Promise<string> => {
  try {
    const response = await fetch("/api/admin/students")
    const result = await response.json()
    
    if (result.success && result.students && Array.isArray(result.students)) {
      const students = result.students
      
      if (students.length === 0) {
        return "2024001"
      }
      
      const studentNumbers = students
        .map((s: any) => {
          const num = s.student_number || s.studentNumber || s.student_id || s.id
          return typeof num === 'string' ? num : num?.toString()
        })
        .filter(Boolean)
        .map((id: string) => {
          const match = id.match(/\d+/)
          return match ? parseInt(match[0], 10) : 0
        })
        .filter((num: number) => !isNaN(num) && num > 0)
      
      if (studentNumbers.length === 0) {
        return "2024001"
      }
      
      const maxNumber = Math.max(...studentNumbers)
      const nextNumber = maxNumber + 1
      return nextNumber.toString().padStart(7, '0')
    }
    
    return "2024001"
  } catch (error) {
    console.error("Error generating student ID:", error)
    return Date.now().toString().slice(-7)
  }
}

export const getRate = (present: number, total: number): string => {
  if (!total) return "0.0"
  return ((present / total) * 100).toFixed(1)
}

export const gradeOptions = [
  "All Grades",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
]

export const studentStatusOptions = ["Enrolled", "Pending", "Alumni", "Inactive"]
