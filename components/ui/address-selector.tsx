"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { loadBarangays } from "@/lib/ph-address"

// Trece Martires City, Cavite constants
const CITY_CODE = "042122" // Trece Martires City code
const CITY_NAME = "Trece Martires City"
const PROVINCE_NAME = "Cavite"
const REGION_NAME = "CALABARZON (Region IV-A)"

export interface AddressData {
  barangay: string
  barangayName: string
  streetDetails: string
}

interface AddressSelectorProps {
  value: AddressData
  onChange: (address: AddressData) => void
  required?: boolean
}

export function AddressSelector({ value, onChange, required = false }: AddressSelectorProps) {
  const [barangayList, setBarangayList] = useState<any[]>([])

  // Load barangays for Trece Martires City on mount
  useEffect(() => {
    loadBarangays(CITY_CODE)
      .then((list) => setBarangayList(list.map(([brgy_code, brgy_name]) => ({ brgy_code, brgy_name }))))
      .catch(() => setBarangayList([]))
  }, [])

  const handleBarangayChange = (barangayCode: string) => {
    const selectedBarangay = barangayList.find((b) => b.brgy_code === barangayCode)
    onChange({
      ...value,
      barangay: barangayCode,
      barangayName: selectedBarangay?.brgy_name || "",
    })
  }

  const handleStreetDetailsChange = (details: string) => {
    onChange({
      ...value,
      streetDetails: details,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Barangay {required && "*"}</Label>
        <Select value={value.barangay} onValueChange={handleBarangayChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select barangay in Trece Martires City" />
          </SelectTrigger>
          <SelectContent>
            {barangayList.map((barangay) => (
              <SelectItem key={barangay.brgy_code} value={barangay.brgy_code}>
                {barangay.brgy_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">{CITY_NAME}, {PROVINCE_NAME}</p>
      </div>

      <div>
        <Label>Street Details {required && "*"}</Label>
        <Input
          value={value.streetDetails}
          onChange={(e) => handleStreetDetailsChange(e.target.value)}
          placeholder="e.g., BLK 23 LT 20 Pacific Town"
        />
      </div>
    </div>
  )
}
