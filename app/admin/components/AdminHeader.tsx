"use client"

import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabaseClient"
import { useAlert } from "@/lib/use-alert"
import Image from "next/image"
import { useState } from "react"
import type { Admin } from "../types"

interface AdminHeaderProps {
  admin: Admin
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { showAlert } = useAlert()

  const adminName = admin.first_name && admin.last_name 
    ? `${admin.first_name} ${admin.last_name}`
    : admin.name || admin.email.split("@")[0]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Logout error:", error)
        showAlert({ message: "Error signing out. Please try again.", type: "error" })
        setIsLoggingOut(false)
        return
      }
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      showAlert({ message: "Error signing out. Please try again.", type: "error" })
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-gradient-to-r from-red-800 to-red-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Image
              src="/logo.png"
              alt="Sto. Niño Logo"
              width={50}
              height={50}
              className="rounded-full bg-white p-1"
            />
            <div>
              <h1 className="text-2xl font-bold">Admin Portal</h1>
              <p className="text-red-100 text-sm">Sto. Niño de Praga Academy</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-sm font-medium">{adminName}</p>
              <Badge variant="secondary" className="bg-red-900 text-white hover:bg-red-900">
                Administrator
              </Badge>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-white text-red-800 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
