'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={className} data-tab-value={value}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { _value: value, _onValueChange: onValueChange });
        }
        return child;
      })}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  _value?: string;
  _onValueChange?: (value: string) => void;
}

export function TabsList({ children, className, _value, _onValueChange }: TabsListProps) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-muted p-1', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { _activeValue: _value, _onSelect: _onValueChange });
        }
        return child;
      })}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  _activeValue?: string;
  _onSelect?: (value: string) => void;
}

export function TabsTrigger({ value, children, className, _activeValue, _onSelect }: TabsTriggerProps) {
  const isActive = _activeValue === value;
  return (
    <button
      type="button"
      onClick={() => _onSelect?.(value)}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  _value?: string;
}

export function TabsContent({ value, children, className, _value }: TabsContentProps) {
  if (_value !== value) return null;
  return (
    <div className={cn('animate-fade-in', className)}>
      {children}
    </div>
  );
}
