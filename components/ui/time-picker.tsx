'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

interface TimePickerProps {
  value?: string; // Format: "HH:mm" or "HH:mm:ss"
  onChange?: (time: string) => void;
  label?: string;
  id?: string;
  className?: string;
  includeSeconds?: boolean;
  defaultValue?: string;
}

export function TimePicker({
  value,
  onChange,
  label,
  id,
  className,
  includeSeconds = true,
  defaultValue = '10:30:00',
}: TimePickerProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        type="time"
        id={id}
        step={includeSeconds ? '1' : undefined}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        defaultValue={defaultValue}
        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </div>
  );
}

export function DatePickerTime() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [time, setTime] = React.useState<string>('10:30:00');

  return (
    <FieldGroup className="mx-auto max-w-xs flex-row">
      <Field>
        <FieldLabel htmlFor="date-picker-optional">Date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-optional"
              className="w-32 justify-between font-normal"
            >
              {date ? format(date, 'PPP') : 'Select date'}
              <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              defaultMonth={date}
              onSelect={(date) => {
                setDate(date);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        <FieldLabel htmlFor="time-picker-optional">Time</FieldLabel>
        <Input
          type="time"
          id="time-picker-optional"
          step="1"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          defaultValue="10:30:00"
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </FieldGroup>
  );
}
