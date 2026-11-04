import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import ProfileAvatar from './ProfileAvatar';
import ProfileDropdown from './ProfileDropdown';

export default function Navbar({ theme, toggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userRole = String(user?.role || '').trim().toLowerCase();
  const canCreatePost = userRole === 'author';
  const isAuthor = userRole === 'author';

  const onLogout = () => {
    logout();
    setShowMenu(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = (
    <>
      <Link to="/" className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-300 dark:hover:text-white" onClick={() => setMobileMenuOpen(false)}>
        Home
      </Link>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors duration-300 hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>

      {user ? (
        <>
          {/* <span className="max-w-[140px] truncate text-sm text-gray-600 dark:text-slate-300"><ProfileAvatar
            name={user.name}
            image={user.image}
          /></span> */}
          <div ref={dropdownRef} className="relative z-50">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-expanded={showMenu}
              aria-label="Toggle profile menu"
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 text-xl text-white">
                <ProfileAvatar
                  name={user.name}
                  image={user.image}
                />
              </div>
            </button>

            {showMenu && (
              <ProfileDropdown
                name={user.name}
                email={user.email}
                onClose={() => setShowMenu(false)}
                onLogout={onLogout}
              />
            )}
          </div>
          {isAuthor ? (
            <Link to="/dashboard" className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-300 dark:hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
          ) : null}
          {canCreatePost ? (
            <Link to="/create" className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500" onClick={() => setMobileMenuOpen(false)}>
              New Post
            </Link>
          ) : null}
        </>
      ) : null}
    </>
  );

  return (
    <>
    <header className="relative z-50 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/90">
      <div className="container mx-auto flex max-w-[1400px] items-center justify-between px-3 py-3 sm:px-4">
        <Link to="/" className="text-2xl font-inter sm:text-2xl" onClick={() => setMobileMenuOpen(false)}>
          BlogNest
        </Link>

        <div className="hidden items-center gap-3 lg:flex lg:items-center lg:justify-end">
          {navItems}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 lg:hidden"
        >
          <span className="flex flex-col items-center gap-1.5">
            <span className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-current transition-opacity ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`block h-0.5 w-5 rounded-full bg-current transition-transform ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </span>
        </button>
      </div>
      {mobileMenuOpen ? (
        <div className="border-t border-gray-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95 lg:hidden">
          <nav className="container mx-auto flex max-w-[1400px] flex-col gap-3 px-3 py-3 sm:px-4">
            {navItems}
          </nav>
        </div>
      ) : null}
    </header>
    <div className='text-center bg-yellow-500 text-black px-3 py-3'>Access to everything. Now 30% off. <span className='font-bold'>Upgrade now</span></div>
    </>
  );
}
