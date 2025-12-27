"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Settings as SettingsIcon } from "lucide-react"
import { useState } from "react"

interface SystemSettings {
  schoolName: string
  academicYear: string
  automaticBackup: boolean
  rfidIntegration: boolean
  emailNotifications: boolean
  studentPortal: boolean
  teacherPortal: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    schoolName: "Sto Niño de Praga Academy",
    academicYear: "2024-2025",
    automaticBackup: true,
    rfidIntegration: true,
    emailNotifications: true,
    studentPortal: true,
    teacherPortal: true,
  })
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleInputChange = (field: keyof SystemSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggle = (field: keyof SystemSettings) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleSave = async () => {
    setSaving(true)
    setFeedback(null)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setFeedback("Settings saved successfully!")
      setTimeout(() => setFeedback(null), 3000)
    } catch (error) {
      setFeedback("Error saving settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-red-800">System Settings</h2>
          <p className="text-gray-600">Configure system preferences and integrations</p>
        </div>
        <SettingsIcon className="w-8 h-8 text-red-800" />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-800">School Information</CardTitle>
            <CardDescription>Basic school configuration settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="schoolName">School Name</Label>
              <Input
                id="schoolName"
                value={settings.schoolName}
                onChange={(e) => handleInputChange("schoolName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={settings.academicYear}
                onChange={(e) => handleInputChange("academicYear", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-800">System Configuration</CardTitle>
            <CardDescription>Enable or disable system features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Automatic Backup",
                  field: "automaticBackup" as keyof SystemSettings,
                  description: "Daily off-site backups",
                },
                {
                  label: "RFID Integration",
                  field: "rfidIntegration" as keyof SystemSettings,
                  description: "Sync attendance readers",
                },
                {
                  label: "Email Notifications",
                  field: "emailNotifications" as keyof SystemSettings,
                  description: "Send alerts to guardians",
                },
                {
                  label: "Student Portal Access",
                  field: "studentPortal" as keyof SystemSettings,
                  description: "Allow student logins",
                },
                {
                  label: "Teacher Portal Access",
                  field: "teacherPortal" as keyof SystemSettings,
                  description: "Enable teacher dashboard",
                },
              ].map((item) => (
                <label key={item.field} className="flex items-start justify-between gap-4 cursor-pointer">
                  <div>
                    <span className="block font-medium text-sm">{item.label}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-red-700 focus:ring-red-500 cursor-pointer"
                    checked={settings[item.field] as boolean}
                    onChange={() => handleToggle(item.field)}
                  />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {feedback && (
          <div
            className={`text-sm p-3 rounded-md ${
              feedback.includes("Error")
                ? "text-red-700 bg-red-50 border border-red-100"
                : "text-green-700 bg-green-50 border border-green-100"
            }`}
          >
            {feedback}
          </div>
        )}

        <Button
          className="bg-red-800 hover:bg-red-700 w-full sm:w-auto"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
