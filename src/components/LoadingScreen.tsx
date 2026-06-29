import { useEffect, useState } from 'react';
import { LogoIcon } from './Logo';

export function LoadingScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <LogoIcon className="w-20 h-20 text-amber-400 animate-pulse" />
          <div className="absolute inset-0 blur-xl bg-amber-400/30 rounded-full animate-ping" />
        </div>
        <span className="text-2xl font-semibold text-white tracking-tight">DayWork</span>
        <div className="flex gap-1 mt-4">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '100ms' }} />
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '200ms' }} />
        </div>
      </div>
    </div>
  );
}
