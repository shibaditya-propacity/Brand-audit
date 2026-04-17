'use client';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface ChipMultiSelectProps {
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ChipMultiSelect({ value, onChange, placeholder = 'Add item...', className }: ChipMultiSelectProps) {
  const [inputVal, setInputVal] = useState('');

  function addItem() {
    const trimmed = inputVal.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal('');
  }

  function removeItem(item: string) {
    onChange(value.filter(v => v !== item));
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <Input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          placeholder={placeholder}
          className="flex-1"
        />
        <button type="button" onClick={addItem} className="flex items-center gap-1 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map(item => (
          <span key={item} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
            {item}
            <button type="button" onClick={() => removeItem(item)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
