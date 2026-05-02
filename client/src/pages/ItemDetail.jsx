import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiCalendar, HiLocationMarker, HiMail, HiPhone, HiOfficeBuilding, HiArchive, HiSparkles } from 'react-icons/hi';
import api from '../api/axios';
import { formatDate, getCategoryLabel } from '../utils/helpers';
import SkeletonCard from '../components/ui/SkeletonCard';
import ItemCard from '../components/dashboard/ItemCard';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const [itemRes, matchRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/matches/${id}`).catch(() => ({ data: { data: [] } })),
        ]);
        setItem(itemRes.data.data);
        setMatches(matchRes.data.data || []);
      } catch {
        toast.error('Item not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleResolve = async () => {
    try {
      await api.put(`/items/${id}/resolve`);
      setItem(prev => ({ ...prev, status: 'resolved' }));
      toast.success('Item marked as resolved');
    } catch {
      toast.error('Failed to resolve');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this item permanently?')) return;
    try {
      await api.delete(`/items/${id}`);
      toast.success('Item deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10"><SkeletonCard /></div>
  );

  if (!item) return null;

  const isOwner = user && item.user && (item.user._id === user._id || item.user === user._id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-500 mb-6 transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-surface-100 border border-surface-200 dark:border-surface-800 overflow-hidden rounded-2xl">
          {/* Image */}
          {item.imageUrl ? (
            <div className="h-72 md:h-96 overflow-hidden">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-72 md:h-96 bg-surface-100 dark:bg-surface-800 flex flex-col items-center justify-center text-surface-400">
              <HiPhotograph className="w-16 h-16 mb-2" />
              <span className="text-sm">No image available</span>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase
                ${item.type === 'lost' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                {item.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium
                ${item.status === 'open' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'}`}>
                {item.status}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium">
                {getCategoryLabel(item.category)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white mb-3">{item.title}</h1>
            <p className="text-surface-600 dark:text-surface-400 leading-relaxed mb-6">{item.description}</p>

            {/* Meta */}
            <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
              <div className="flex items-center gap-2 text-surface-500">
                <HiCalendar className="w-4 h-4" /> {formatDate(item.date)}
              </div>
              {item.location?.text && (
                <div className="flex items-center gap-2 text-surface-500">
                  <HiLocationMarker className="w-4 h-4" /> {item.location.text}
                </div>
              )}
              {item.venue && (
                <div className="flex items-center gap-2 text-surface-500"><HiOfficeBuilding className="w-4 h-4" /> {item.venue}</div>
              )}
              {item.storageLocation && (
                <div className="flex items-center gap-2 text-surface-500"><HiArchive className="w-4 h-4" /> {item.storageLocation}</div>
              )}
            </div>

            {/* Contact */}
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
              <h3 className="font-semibold text-surface-700 dark:text-surface-300 mb-2">Contact</h3>
              <p className="font-medium text-surface-800 dark:text-surface-200">{item.contactName}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <a href={`mailto:${item.contactEmail}`} className="flex items-center gap-1.5 text-primary-500 hover:underline">
                  <HiMail className="w-4 h-4" /> {item.contactEmail}
                </a>
                {item.contactPhone && (
                  <a href={`tel:${item.contactPhone}`} className="flex items-center gap-1.5 text-primary-500 hover:underline">
                    <HiPhone className="w-4 h-4" /> {item.contactPhone}
                  </a>
                )}
              </div>
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex gap-3 mt-6">
                {item.status === 'open' && (
                  <button
                    onClick={handleResolve}
                    className="px-5 py-2.5 bg-success text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors"
                  >
                    ✓ Mark Resolved
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Delete Item
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Potential matches */}
        {matches.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
              <HiSparkles className="w-6 h-6 text-primary-500" /> Potential Matches ({matches.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {matches.map(m => {
                const otherItem = item.type === 'lost' ? m.foundItem : m.lostItem;
                if (!otherItem) return null;
                return <ItemCard key={m._id} item={otherItem} matchScore={m.combinedScore} />;
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
