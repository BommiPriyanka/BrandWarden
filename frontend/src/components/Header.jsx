import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, BookOpen, FileText, PlusCircle, Settings, UserCheck } from './icons';
import { useRole, ROLES } from '../context/RoleContext';

export default function Header() {
  const { role, setRole } = useRole();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5 text-white hover:text-emerald-400 transition-colors">
              <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">BrandWarden</span>
              <span className="hidden sm:inline-block text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Northwind Outdoor
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                to="/submit"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/submit')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Submit Draft</span>
              </Link>
              <Link
                to="/guidelines"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/guidelines')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Guidelines</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-sky-400" />
                <span>Privacy & AI</span>
              </Link>
            </nav>
          </div>

          {/* Role Switcher & Demo Notice */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex flex-col items-end">
              <div className="text-[11px] font-mono text-emerald-400/90 font-medium">
                Demo mode: role switcher replaces login
              </div>
              <div className="text-[10px] text-slate-400">
                Permissions enforced on backend
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-lg p-1.5 shadow-inner">
              <UserCheck className="w-4 h-4 text-emerald-400 ml-1.5" />
              <label htmlFor="role-select" className="text-xs text-slate-300 font-medium">
                Viewing as:
              </label>
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
