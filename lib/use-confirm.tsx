"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"
import { createContext, ReactNode, useCallback, useContext, useState } from "react"

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

interface ConfirmContextType {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions>({
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default",
  })
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setConfirmOptions({
      ...options,
      confirmText: options.confirmText || "Confirm",
      cancelText: options.cancelText || "Cancel",
      variant: options.variant || "default",
    })
    setIsOpen(true)

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve)
    })
  }, [])

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true)
    }
    setIsOpen(false)
  }

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false)
    }
    setIsOpen(false)
  }

  const getTitle = () => {
    if (confirmOptions.title) return confirmOptions.title
    return confirmOptions.variant === "destructive" ? "Confirm Action" : "Confirmation"
  }

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-6 w-6 ${confirmOptions.variant === "destructive" ? "text-red-600" : "text-yellow-600"}`} />
              <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="whitespace-pre-line">
              {confirmOptions.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {confirmOptions.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmOptions.variant === "destructive" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmOptions.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (context === undefined) {
    throw new Error("useConfirm must be used within a ConfirmProvider")
  }
  return context
}
