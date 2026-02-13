"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FullScreenLoaderProps {
  text?: string;
  className?: string;
}

export function FullScreenLoader({ text = "Cargando...", className }: FullScreenLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className={cn(
      "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 animate-in fade-in fill-mode-forwards",
      className
    )}>
      <div className="flex flex-col items-center justify-center gap-8 p-8 animate-in zoom-in-95 duration-500 slide-in-from-bottom-4">
        <div className="relative">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-Correagro-horizontal-0JBrWIjHBRFbepaFmd6S5eooMmQuv9.png"
            alt="Correagro S.A."
            width={220}
            height={55}
            className="object-contain"
          />
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center">
             <div className="absolute h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
             <div className="absolute h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-b-transparent reverse-spin" />
          </div>
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            {text}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
