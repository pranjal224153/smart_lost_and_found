import { HiSearch, HiAdjustments } from 'react-icons/hi';
import { CATEGORIES } from '../../utils/helpers';

export default function FilterBar({ filters, setFilters }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
        <input
          type="text"
          placeholder="Search items..."
          value={filters.search || ''}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
        />
      </div>

      {/* Category */}
      <select
        value={filters.category || ''}
        onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
        className="px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map(c => (
          <option key={c.value} value={c.value}>
            {c.icon} {c.label}
          </option>
        ))}
      </select>

      {/* Status */}
      <select
        value={filters.status || ''}
        onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
        className="px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
      >
        <option value="">All Status</option>
        <option value="open">Open</option>
        <option value="resolved">Resolved</option>
      </select>

      {/* Sort */}
      <select
        value={filters.sort || 'latest'}
        onChange={e => setFilters(p => ({ ...p, sort: e.target.value }))}
        className="px-4 py-2.5 rounded-xl bg-surface-100 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
      >
        <option value="latest">Latest First</option>
        <option value="oldest">Oldest First</option>
        <option value="title">By Title</option>
      </select>
    </div>
  );
}
