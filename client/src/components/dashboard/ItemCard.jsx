import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiLocationMarker, HiCalendar, HiPhotograph, HiSparkles } from 'react-icons/hi';
import { formatDate, getCategoryLabel } from '../../utils/helpers';

export default function ItemCard({ item, matchScore, onResolve, onDelete, to }) {
  const statusColors = {
    open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    resolved: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="group rounded-2xl overflow-hidden bg-surface-100 border border-surface-200 dark:border-surface-800 hover:border-primary-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-500 flex flex-col h-full"
    >
      <div className="flex-grow">
        <Link to={to || `/items/${item._id}`}>
          {/* Image */}
          <div className="relative h-48 overflow-hidden bg-surface-100 dark:bg-surface-200">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-surface-400 bg-surface-200 dark:bg-surface-700">
                <HiPhotograph className="w-8 h-8" />
              </div>
            )}
            {/* Type badge */}
            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
              ${item.type === 'lost'
                ? 'bg-red-500/90 text-white'
                : 'bg-blue-500/90 text-white'
              }`}>
              {item.type}
            </div>
            {/* Status badge */}
            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
              {item.status}
            </div>
            {/* Matches badge */}
            {item.matchCount > 0 && (
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-primary-600 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow-lg animate-pulse">
                <HiSparkles className="w-3 h-3" />
                {item.matchCount} MATCH{item.matchCount > 1 ? 'ES' : ''} FOUND
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="flex items-center gap-2 font-bold text-lg text-surface-900 dark:text-surface-900 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'lost' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`} />
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
              {item.description}
            </p>

            {/* Meta */}
            <div className="mt-3 flex items-center gap-4 text-xs text-surface-400 dark:text-surface-500">
              <span className="flex items-center gap-1">
                <HiCalendar className="w-3.5 h-3.5" />
                {formatDate(item.date)}
              </span>
              {item.location?.text && (
                <span className="flex items-center gap-1 truncate">
                  <HiLocationMarker className="w-3.5 h-3.5" />
                  {item.location.text}
                </span>
              )}
            </div>

            {/* Match score */}
            {matchScore != null && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-primary-600 dark:text-primary-400">Match</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">{Math.round(matchScore * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="match-bar"
                    style={{ width: `${matchScore * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Category tag */}
            <div className="mt-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium">
                {getCategoryLabel(item.category)}
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 bg-surface-50 dark:bg-surface-200/50 border-t border-surface-100 dark:border-surface-800 flex items-center gap-3">
        {item.status === 'open' && onResolve && (
          <button
            onClick={(e) => { e.preventDefault(); onResolve(); }}
            className="flex-grow py-2 text-xs font-bold bg-success/10 text-success rounded-xl hover:bg-success hover:text-white transition-all shadow-sm"
          >
            Mark as Resolved
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="px-4 py-2 text-xs font-bold bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-all"
          >
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}
