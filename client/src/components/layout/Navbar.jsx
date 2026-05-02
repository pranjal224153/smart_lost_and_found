import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX, HiSun, HiMoon, HiBell, HiSearch } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

import { useNotifications } from '../../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    ...(user ? [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/report/lost', label: 'Report Lost' },
      { to: '/report/found', label: 'Report Found' },
    ] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white shadow-sm">
              <HiSearch className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent tracking-tight">
              FindIt
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(link.to)
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'text-surface-600 dark:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-100'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                {/* Notifications */}
                <Link
                  to="/dashboard?tab=matches"
                  className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
                >
                  <HiBell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-900" />
                  )}
                </Link>

                {/* User menu */}
                <div className="hidden md:flex items-center gap-3 ml-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="text-sm text-surface-500 hover:text-danger transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-300 hover:text-primary-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(p => !p)}
              className="md:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800"
            >
              {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-100 shadow-xl"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(link.to)
                      ? 'bg-primary-500/10 text-primary-600'
                      : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm text-surface-600">Log in</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-sm bg-primary-600 text-white rounded-lg text-center">Sign up</Link>
                </>
              )}
              {user && (
                <button
                  onClick={() => { logout(); navigate('/'); setMobileOpen(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-danger"
                >
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
