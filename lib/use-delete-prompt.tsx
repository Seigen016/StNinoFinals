'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

interface DeletePromptOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  /** When provided, renders a dropdown instead of a free-text area.
   *  Include 'Other' to reveal a text input when selected. */
  presets?: string[];
}

interface DeletePromptResult {
  confirmed: boolean;
  reason: string;
}

interface DeletePromptContextType {
  showDeletePrompt: (options: DeletePromptOptions) => Promise<DeletePromptResult | null>;
}

const DeletePromptContext = createContext<DeletePromptContextType | undefined>(undefined);

export function DeletePromptProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DeletePromptOptions>({ message: '' });
  const [selected, setSelected] = useState('');
  const [otherText, setOtherText] = useState('');
  const [resolvePromise, setResolvePromise] = useState<((value: DeletePromptResult | null) => void) | null>(null);

  const showDeletePrompt = useCallback((opts: DeletePromptOptions): Promise<DeletePromptResult | null> => {
    setOptions({
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      reasonLabel: 'Reason',
      reasonRequired: false,
      ...opts,
    });
    setSelected('');
    setOtherText('');

    return new Promise<DeletePromptResult | null>((resolve) => {
      setResolvePromise(() => resolve);
      setTimeout(() => setIsOpen(true), 0);
    });
  }, []);

  const resolvedReason = options.presets
    ? (selected === 'Other' ? otherText.trim() : selected)
    : selected;

  const canConfirm = options.reasonRequired ? !!resolvedReason : true;

  const handleConfirm = () => {
    if (!canConfirm) return;
    resolvePromise?.({ confirmed: true, reason: resolvedReason });
    setIsOpen(false);
  };

  const handleCancel = () => {
    resolvePromise?.(null);
    setIsOpen(false);
  };

  return (
    <DeletePromptContext.Provider value={{ showDeletePrompt }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <DialogTitle>{options.title || 'Confirm Action'}</DialogTitle>
            </div>
            <DialogDescription className="whitespace-pre-line">{options.message}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <label className="text-sm font-medium text-gray-700">
              {options.reasonLabel || 'Reason'}
              {options.reasonRequired && <span className="text-red-500 ml-1">*</span>}
            </label>

            {options.presets ? (
              <>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.presets.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selected === 'Other' && (
                  <Textarea
                    placeholder="Please specify…"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                )}
              </>
            ) : (
              <Textarea
                placeholder="Enter a reason (optional)…"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                rows={3}
                className="resize-none"
              />
            )}
          </div>

          <DialogFooter>
            <button
              onClick={handleCancel}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {options.cancelText || 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {options.confirmText || 'Confirm'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DeletePromptContext.Provider>
  );
}

export function useDeletePrompt() {
  const context = useContext(DeletePromptContext);
  if (!context) throw new Error('useDeletePrompt must be used within a DeletePromptProvider');
  return context;
}
