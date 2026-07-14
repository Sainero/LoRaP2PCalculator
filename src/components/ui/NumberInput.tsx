import React, { useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  hideSpinner?: boolean;
  title?: string;
}

export function NumberInput({ value, onChange, min, max, step = 1, className, hideSpinner = false, title }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = (v: number) => {
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const increment = () => {
    onChange(clamp(Number((value + step).toFixed(10))));
  };

  const decrement = () => {
    onChange(clamp(Number((value - step).toFixed(10))));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      increment();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      decrement();
    }
  };

  return (
    <div className={cn('relative flex items-stretch overflow-hidden rounded-xl', hideSpinner && 'contents')}>
      <input
        ref={inputRef}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        title={title}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!isNaN(v)) onChange(clamp(v));
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-colors bg-white text-slate-900 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          !hideSpinner && 'pr-10',
          className
        )}
      />
      {!hideSpinner && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
          <button
            type="button"
            tabIndex={-1}
            onClick={increment}
            className="flex items-center justify-center w-7 h-5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-t-md transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={decrement}
            className="flex items-center justify-center w-7 h-5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-b-md transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
