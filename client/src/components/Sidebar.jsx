import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  ListChecks,
  UsersRound,
  Radio,
  BarChart3,
  Trophy,
  Users,
  ShieldAlert,
  Settings,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const items = [
  ['/admin', LayoutDashboard, 'Dashboard'],
  ['/admin/create-test', FilePlus2, 'Create Test'],
  ['/admin/tests', ClipboardList, 'Manage Tests'],
  ['/admin/questions', ListChecks, 'Question Manager'],
  ['/admin/attempts', UsersRound, 'Student Attempts'],
  ['/admin/live', Radio, 'Live Test Monitor'],
  ['/admin/results', BarChart3, 'Results'],
  ['/admin/leaderboard', Trophy, 'Leaderboard'],
  ['/admin/students', Users, 'Students'],
  ['/admin/security', ShieldAlert, 'Security Logs'],
  ['/admin/settings', Settings, 'Settings'],
];

export default function Sidebar() {
  const { admin, logout } = useAuth();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleMenu = () => {
      setOpen((value) => !value);
    };

    window.addEventListener('mtp:menu', handleMenu);

    return () => {
      window.removeEventListener('mtp:menu', handleMenu);
    };
  }, []);

  const adminRole = admin?.role || admin?.adminRole;

  const visibleItems = items.filter(([to]) => {
    if (to === '/admin/settings') {
      return adminRole === 'super_admin';
    }

    return true;
  });

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 lg:hidden ${
          open ? 'block' : 'hidden'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#080d1c]/95 p-5 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <img
            src="/logo.png"
            alt="MockTest Pro Logo"
            className="h-11 w-11 rounded-2xl object-cover"
          />

          <div>
            <h1 className="font-bold">
              MockTest Pro
            </h1>

            <p className="text-xs text-slate-500">
              {adminRole === 'super_admin'
                ? 'Super Admin Console'
                : 'Admin Console'}
            </p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {visibleItems.map(([to, Icon, label]) => (
            <NavLink
              end={to === '/admin'}
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={18} />

              {label}
            </NavLink>
          ))}
        </nav>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-rose-400 hover:bg-rose-500/10"
        >
          <LogOut size={18} />
          Logout
        </button>

        {/* FOOTER */}
        <p className="mt-4 border-t border-white/10 pt-4 text-center text-[10px] text-slate-600">
          Designed & Developed by
          <br />

          <span className="font-semibold text-violet-400">
            Hridyansh Chaudhary
          </span>
        </p>
      </aside>
    </>
  );
}