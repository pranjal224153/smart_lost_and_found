import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              FindIt
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-surface-500">
          </div>
          <p className="text-xs text-surface-400">
            © {new Date().getFullYear()} FindIt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
