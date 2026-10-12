'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AddressParts } from '@/lib/address';
import { loadBarangays, loadPlaces, type Place } from '@/lib/ph-address';
import { useEffect, useState } from 'react';

// Province → City/Municipality → Barangay drop-downs plus street, the same
// Select components the admin address selector uses. Stores names; codes are
// looked up from the names so the value stays plain AddressParts.
export function AddressFields({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: AddressParts;
  onChange: (value: AddressParts) => void;
  disabled?: boolean;
}) {
  const [provinces, setProvinces] = useState<Place[]>([]);
  const [citiesByProvince, setCitiesByProvince] = useState<Record<string, Place[]>>({});
  const [barangays, setBarangays] = useState<Place[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    loadPlaces()
      .then((d) => {
        setProvinces(d.provinces);
        setCitiesByProvince(d.cities);
      })
      .catch(() => setLoadError(true));
  }, []);

  const provinceCode = provinces.find(([, n]) => n === value.province)?.[0] ?? '';
  const cities = citiesByProvince[provinceCode] ?? [];
  const cityCode = cities.find(([, n]) => n === value.city)?.[0] ?? '';

  useEffect(() => {
    setBarangays([]);
    if (!cityCode) return;
    loadBarangays(cityCode)
      .then(setBarangays)
      .catch(() => setLoadError(true));
  }, [cityCode]);

  const triggerClass = 'h-11 bg-white border-gray-200';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-province`} className="text-sm font-medium text-gray-700" required>
          Province
        </Label>
        <Select
          value={value.province}
          onValueChange={(province) => onChange({ ...value, province, city: '', barangay: '' })}
          disabled={disabled || provinces.length === 0}
          required
        >
          <SelectTrigger id={`${id}-province`} className={triggerClass}>
            <SelectValue placeholder={provinces.length ? 'Select province' : 'Loading…'} />
          </SelectTrigger>
          <SelectContent>
            {provinces.map(([code, name]) => (
              <SelectItem key={code} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-city`} className="text-sm font-medium text-gray-700" required>
          City/Municipality
        </Label>
        <Select
          value={value.city}
          onValueChange={(city) => onChange({ ...value, city, barangay: '' })}
          disabled={disabled || !provinceCode}
          required
        >
          <SelectTrigger id={`${id}-city`} className={triggerClass}>
            <SelectValue placeholder={provinceCode ? 'Select city/municipality' : 'Select a province first'} />
          </SelectTrigger>
          <SelectContent>
            {cities.map(([code, name]) => (
              <SelectItem key={code} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-barangay`} className="text-sm font-medium text-gray-700" required>
          Barangay
        </Label>
        <Select
          value={value.barangay}
          onValueChange={(barangay) => onChange({ ...value, barangay })}
          disabled={disabled || !cityCode || barangays.length === 0}
          required
        >
          <SelectTrigger id={`${id}-barangay`} className={triggerClass}>
            <SelectValue placeholder={cityCode ? (barangays.length ? 'Select barangay' : 'Loading…') : 'Select a city first'} />
          </SelectTrigger>
          <SelectContent>
            {barangays.map(([code, name]) => (
              <SelectItem key={code} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${id}-street`} className="text-sm font-medium text-gray-700" required>
          House No./Street
        </Label>
        <Input
          id={`${id}-street`}
          value={value.street}
          placeholder="e.g., BLK 23 LT 20 Pacific Town"
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          required
          disabled={disabled}
          className="h-11 bg-white border-gray-200"
        />
      </div>

      {loadError && (
        <p className="sm:col-span-2 text-xs text-red-600">
          Could not load the address list. Please check your connection and reload the page.
        </p>
      )}
    </div>
  );
}
