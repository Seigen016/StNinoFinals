'use client';

import { ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportDropdownProps {
  onPDF: () => void | Promise<void>;
  onExcel: () => void | Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'default';
}

export function ExportDropdown({ onPDF, onExcel, disabled, size = 'default' }: ExportDropdownProps) {
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null);

  async function handle(type: 'pdf' | 'excel', fn: () => void | Promise<void>) {
    setLoading(type);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled || busy}
          className="gap-1.5"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Export
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          className="gap-2"
          onSelect={() => handle('pdf', onPDF)}
          disabled={busy}
        >
          <FileText className="h-4 w-4 text-red-600" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2"
          onSelect={() => handle('excel', onExcel)}
          disabled={busy}
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
