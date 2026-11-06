import {
  User,
  Settings,
  CircleHelp,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function ProfileDropdown({ name, email, onClose, onLogout }) {
  return (
    <div className="absolute right-0 top-full z-[60] mt-3 w-80 rounded-xl border border-gray-200 bg-white text-slate-800 shadow-lg ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-white/5">
      <div className="flex items-center gap-4 p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-600 text-3xl text-white">
          {name.charAt(0).toUpperCase()}
        </div>

        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <button type="button" className="text-gray-500 hover:text-black dark:text-slate-300 dark:hover:text-white">
            <Link to={`/profile`}>View Profile</Link>
          </button>
        </div>
      </div>

      <hr className="border-gray-200 dark:border-slate-700" />

      <div className="py-2">
        <button type="button" onClick={onClose} className="flex w-full items-center gap-4 px-5 py-3 text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800">
          <User size={22} />
          <span>Profile</span>
        </button>

        <button type="button" onClick={onClose} className="flex w-full items-center gap-4 px-5 py-3 text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800">
          <Settings size={22} />
          <span><Link to="/help">Settings</Link></span>
        </button>

        <button type="button" onClick={onClose} className="flex w-full items-center gap-4 px-5 py-3 text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800">
          <CircleHelp size={22} />
          <span>Help</span>
        </button>
      </div>

      <hr className="border-gray-200 dark:border-slate-700" />

      <div className="p-5">
        <button
          type="button"
          onClick={() => {
            onClose?.();
            onLogout?.();
          }}
          className="flex items-center gap-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          
          Sign out
        </button>

        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{email}</p>
      </div>
    </div>
  );
}