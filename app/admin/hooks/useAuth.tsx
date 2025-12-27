"use client"

import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"
import type { Admin } from "../types"

export function useAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error("Auth error:", error)
          window.location.href = "/"
          return
        }

        if (!data.user) {
          window.location.href = "/"
          return
        }

        const { data: adminData, error: adminError } = await supabase
          .from("users")
          .select("*")
          .eq("email", data.user.email || "")
          .eq("role", "admin")
          .single()

        if (adminError || !adminData) {
          console.error("Admin check error:", adminError)
          window.location.href = "/"
          return
        }

        setAdmin(adminData as Admin)
      } catch (error) {
        console.error("Unexpected error:", error)
        window.location.href = "/"
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [])

  return { admin, loading }
}
