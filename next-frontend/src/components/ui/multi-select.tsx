'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
      if (selected.length === options.length) {
          onChange([]);
      } else {
          onChange(options.map(o => o.value));
      }
  }

  const handleClear = () => {
      onChange([]);
  }

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between hover:bg-white text-left font-normal"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <span className="truncate">
          {selected.length === 0
            ? placeholder
            : selected.length === options.length
            ? `Todos (${selected.length})`
            : `${selected.length} seleccionado${selected.length !== 1 ? 's' : ''}`}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1 space-y-1">
             <div 
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={handleSelectAll}
             >
                 <Checkbox 
                    checked={selected.length === options.length && options.length > 0} 
                    onCheckedChange={handleSelectAll}
                 />
                 <span className="text-sm font-medium">Seleccionar Todos</span>
             </div>
            {filteredOptions.length === 0 ? (
              <div className="py-2 text-center text-sm text-gray-500">No hay resultados.</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                  onClick={() => handleSelect(option.value)}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                  />
                  <span className="text-sm truncate" title={option.label}>{option.label}</span>
                </div>
              ))
            )}
          </div>
          {selected.length > 0 && (
              <div className="p-2 border-t text-center">
                  <button onClick={handleClear} className="text-xs text-red-500 hover:underline">Limpiar selección</button>
              </div>
          )}
        </div>
      )}
    </div>
  );
}
