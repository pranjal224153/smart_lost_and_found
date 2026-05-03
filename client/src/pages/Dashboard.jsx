import { useState, useEffect } from 'react';
import { HiSearch, HiArchive, HiSparkles, HiPhotograph } from 'react-icons/hi';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import TabNav from '../components/dashboard/TabNav';
import FilterBar from '../components/dashboard/FilterBar';
import ItemCard from '../components/dashboard/ItemCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'lost');
  const [filters, setFilters] = useState({ search: '', category: '', status: '', sort: 'latest' });
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [counts, setCounts] = useState({ lost: 0, found: 0, matches: 0 });

  // Initial fetch for counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [lostRes, foundRes, matchesRes] = await Promise.all([
          api.get('/items/my', { params: { type: 'lost' } }),
          api.get('/items/my', { params: { type: 'found' } }),
          api.get('/matches'),
        ]);
        setCounts({
          lost: lostRes.data.data.length,
          found: foundRes.data.data.length,
          matches: matchesRes.data.data.length
        });
      } catch (err) {
        console.error('Failed to fetch counts');
      }
    };
    fetchCounts();
  }, []);

  // Fetch data for active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Also fetch counts to keep everything in sync
        const [lostCountRes, foundCountRes, matchCountRes] = await Promise.all([
          api.get('/items/my', { params: { type: 'lost' } }),
          api.get('/items/my', { params: { type: 'found' } }),
          api.get('/matches'),
        ]);
        
        setCounts({
          lost: lostCountRes.data.data.length,
          found: foundCountRes.data.data.length,
          matches: matchCountRes.data.data.length
        });

        if (activeTab === 'matches') {
          setMatches(matchCountRes.data.data || []);
        } else {
          const params = { type: activeTab };
          if (filters.category) params.category = filters.category;
          if (filters.status) params.status = filters.status;
          if (filters.search) params.search = filters.search;
          if (filters.sort) params.sort = filters.sort;
          const { data } = await api.get('/items/my', { params });
          setItems(data.data || []);
        }
      } catch (err) {
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, filters]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/items/${id}/resolve`);
      toast.success('Item marked as resolved');
      setItems(prev => prev.map(i => i._id === id ? { ...i, status: 'resolved' } : i));
    } catch {
      toast.error('Failed to resolve item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success('Report deleted successfully');
      setItems(prev => prev.filter(i => i._id !== id));
      // Refresh all counts
      const [lostRes, foundRes, matchesRes] = await Promise.all([
        api.get('/items/my', { params: { type: 'lost' } }),
        api.get('/items/my', { params: { type: 'found' } }),
        api.get('/matches'),
      ]);
      setCounts({
        lost: lostRes.data.data.length,
        found: foundRes.data.data.length,
        matches: matchesRes.data.data.length
      });
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const tabs = [
    { value: 'lost', label: 'Lost Items', count: counts.lost },
    { value: 'found', label: 'Found Items', count: counts.found },
    { value: 'matches', label: 'Smart Matches', count: counts.matches },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Dashboard</h1>
          <p className="text-surface-500 mt-1">Manage your lost and found items</p>
        </div>
        <button
          onClick={() => {
            // Trigger refresh by updating filters slightly or just re-running effect
            setFilters(prev => ({ ...prev }));
            toast.success('Refreshing data...');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors shadow-sm"
        >
          <HiSparkles className="w-4 h-4 text-primary-500" /> Refresh Matches
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="mb-6">
        <TabNav tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {/* Filters (not for matches tab) */}
      {activeTab !== 'matches' && (
        <div className="mb-6">
          <FilterBar filters={filters} setFilters={setFilters} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : activeTab === 'matches' ? (
        matches.length === 0 ? (
          <EmptyState type="matches" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map(match => (
              <MatchPreviewCard key={match._id} match={match} />
            ))}
          </div>
        )
      ) : (
        items.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <ItemCard 
                key={item._id} 
                item={item} 
                onResolve={() => handleResolve(item._id)}
                onDelete={() => handleDelete(item._id)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ type }) {
  const messages = {
    lost: { icon: <HiSearch className="w-12 h-12" />, title: 'No lost items yet', desc: 'Report a lost item to get started.' },
    found: { icon: <HiArchive className="w-12 h-12" />, title: 'No found items yet', desc: 'Report a found item to help someone.' },
    matches: { icon: <HiSparkles className="w-12 h-12" />, title: 'No matches yet', desc: 'Matches will appear when AI finds potential connections.' },
  };
  const msg = messages[type] || messages.lost;

  return (
    <div className="text-center py-20 flex flex-col items-center">
      <div className="text-surface-400 dark:text-surface-600 mb-4 bg-surface-100 dark:bg-surface-200 p-4 rounded-full">
        {msg.icon}
      </div>
      <h3 className="text-xl font-semibold text-surface-900 dark:text-white tracking-tight">{msg.title}</h3>
      <p className="text-surface-500 mt-2 max-w-sm">{msg.desc}</p>
    </div>
  );
}

function MatchPreviewCard({ match }) {
  const score = Math.round((match.combinedScore || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-surface-100 border border-surface-200 dark:border-surface-800 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
          {score}% Match
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium
          ${match.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : match.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {match.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden mb-4">
        <div className="match-bar" style={{ width: `${score}%` }} />
      </div>

      {/* Side by side */}
      <div className="grid grid-cols-2 gap-4">
        <MiniItem item={match.lostItem} label="Lost" color="red" />
        <MiniItem item={match.foundItem} label="Found" color="blue" />
      </div>

      <a
        href={`/match/${match._id}`}
        className="block mt-4 text-center py-2 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
      >
        View Details
      </a>
    </motion.div>
  );
}

function MiniItem({ item, label, color }) {
  if (!item) return <div className="text-sm text-surface-400">Deleted</div>;
  const colorClass = color === 'red' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="space-y-2">
      <span className={`inline-block px-2 py-0.5 rounded text-xs text-white font-medium ${colorClass}`}>
        {label}
      </span>
      <div className="rounded-lg overflow-hidden h-24 bg-surface-100 dark:bg-surface-800">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-400 bg-surface-200 dark:bg-surface-700">
            <HiPhotograph className="w-8 h-8" />
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-surface-800 dark:text-surface-700 line-clamp-1">{item.title}</p>
    </div>
  );
}
