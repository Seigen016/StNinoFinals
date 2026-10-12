'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';

interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  fromYear = 1940,
  toYear = new Date().getFullYear() + 5,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>();

  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const d = new Date(value + 'T00:00:00');
    return isNaN(d.getTime()) ? undefined : d;
  }, [value]);

  // When opening, jump to selected date or 18 years ago
  const handleOpenChange = (next: boolean) => {
    if (next && !month) {
      if (selected) {
        setMonth(selected);
      } else {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        setMonth(d);
      }
    }
    setOpen(next);
  };

  const handleSelect = (date: Date | undefined) => {
    setOpen(false);
    if (date && onChange) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
        >
          <span className="text-left truncate">
            {selected ? format(selected, 'yyyy-MM-dd') : placeholder || 'Select date'}
          </span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
