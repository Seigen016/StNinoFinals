'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as React from 'react';

interface DateRangeValue {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value: DateRangeValue | undefined;
  onChange: (range: DateRangeValue | undefined) => void;
  placeholder?: string;
  disableFuture?: boolean;
}

const today = () => new Date();

const PRESETS = [
  {
    label: 'Today',
    range: () => ({ from: today(), to: today() }),
  },
  {
    label: 'Yesterday',
    range: () => ({ from: subDays(today(), 1), to: subDays(today(), 1) }),
  },
  {
    label: 'This Week',
    range: () => ({ from: startOfWeek(today(), { weekStartsOn: 1 }), to: endOfWeek(today(), { weekStartsOn: 1 }) }),
  },
  {
    label: 'Last 7 Days',
    range: () => ({ from: subDays(today(), 6), to: today() }),
  },
  {
    label: 'This Month',
    range: () => ({ from: startOfMonth(today()), to: endOfMonth(today()) }),
  },
  {
    label: 'Last Month',
    range: () => {
      const last = subMonths(today(), 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    },
  },
  {
    label: 'This Year',
    range: () => ({ from: startOfYear(today()), to: endOfYear(today()) }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  disableFuture = true,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const clickCount = React.useRef(0);

  React.useEffect(() => {
    if (open) clickCount.current = 0;
  }, [open]);

  const label = React.useMemo(() => {
    if (value?.from && value?.to) {
      if (value.from.toDateString() === value.to.toDateString())
        return format(value.from, 'MMM d, yyyy');
      return `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`;
    }
    if (value?.from) return `${format(value.from, 'MMM d, yyyy')} – ...`;
    return placeholder || 'Select date range';
  }, [value, placeholder]);

  const activePreset = React.useMemo(() => {
    if (!value?.from || !value?.to) return null;
    return PRESETS.find((p) => {
      const r = p.range();
      return (
        r.from.toDateString() === value.from!.toDateString() &&
        r.to.toDateString() === value.to!.toDateString()
      );
    })?.label ?? null;
  }, [value]);

  const handlePreset = (preset: typeof PRESETS[number]) => {
    onChange(preset.range());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`justify-between text-left font-normal ${!value?.from ? 'text-muted-foreground' : ''}`}
        >
          <span className="truncate">{label}</span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" collisionPadding={16}>
        <div className="flex">
          {/* Preset sidebar */}
          <div className="flex flex-col border-r border-gray-100 p-2 gap-0.5 min-w-[120px]">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                className={`text-left text-xs px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  activePreset === preset.label
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <Calendar
            mode="range"
            selected={value?.from ? { from: value.from, to: value.to } : undefined}
            onSelect={(range) => {
              clickCount.current++;
              onChange(range ? { from: range.from, to: range.to } : undefined);
              if (clickCount.current >= 2 && range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            disabled={disableFuture ? { after: new Date() } : undefined}
            defaultMonth={subMonths(value?.from || new Date(), 1)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
