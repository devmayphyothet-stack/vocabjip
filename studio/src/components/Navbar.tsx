import React from 'react';
import { useAuth } from '../context/auth-context';
import { LogOut, ShieldCheck, PenTool, ExternalLink } from 'lucide-react';

interface NavbarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  pendingReviewCount?: number;
}

export function Navbar({ activeView, setActiveView, pendingReviewCount = 0 }: NavbarProps) {
  const { user, isAdmin, isContributor, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-6 flex items-center justify-between shadow-sm">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveView('vocab')}>
          <img src="/logo.png" alt="VocabJip" className="w-9 h-9 rounded-xl object-contain shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">VocabJip Studio</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                v1.0 • Web
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Contributor & Admin Management</p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Admin Review Badge Quick Link */}
        {isAdmin && pendingReviewCount > 0 && (
          <button
            onClick={() => setActiveView('review')}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>{pendingReviewCount} pending reviews</span>
          </button>
        )}

        {/* Role Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border bg-slate-50 text-slate-700 border-slate-200">
          {isAdmin ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-blue-700 font-bold">ADMIN</span>
            </>
          ) : isContributor ? (
            <>
              <PenTool className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">CONTRIBUTOR</span>
            </>
          ) : (
            <span className="text-slate-600">STUDENT</span>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.display_name || 'Teacher'}</p>
            <p className="text-[11px] text-slate-400 font-mono">{user?.email}</p>
          </div>

          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
