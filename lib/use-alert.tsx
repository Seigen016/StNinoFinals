"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"
import { createContext, ReactNode, useCallback, useContext, useState } from "react"

type AlertType = "success" | "error" | "warning" | "info"

interface AlertOptions {
  title?: string
  message: string
  type?: AlertType
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    message: "",
    type: "info",
  })

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options)
    setIsOpen(true)
  }, [])

  const getIcon = () => {
    switch (alertOptions.type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />
      case "warning":
        return <AlertCircle className="h-6 w-6 text-yellow-600" />
      default:
        return <Info className="h-6 w-6 text-blue-600" />
    }
  }

  const getTitle = () => {
    if (alertOptions.title) return alertOptions.title
    switch (alertOptions.type) {
      case "success":
        return "Success"
      case "error":
        return "Error"
      case "warning":
        return "Warning"
      default:
        return "Information"
    }
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              {getIcon()}
              <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="whitespace-pre-line">
              {alertOptions.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider")
  }
  return context
}
