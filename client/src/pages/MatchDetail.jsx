import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowLeft, HiMail, HiPhone, HiLocationMarker, HiCalendar, HiPhotograph, HiShieldCheck, HiLockClosed } from 'react-icons/hi';
import api from '../api/axios';
import { formatDate, getCategoryLabel } from '../utils/helpers';
import SkeletonCard from '../components/ui/SkeletonCard';
import toast from 'react-hot-toast';

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        // We'll fetch matches for user and find the specific one
        const { data } = await api.get('/matches');
        const found = (data.data || []).find(m => m._id === id);
        if (found) setMatch(found);
      } catch {
        toast.error('Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  const handleAction = async (status) => {
    try {
      await api.put(`/matches/${id}`, { status });
      setMatch(prev => ({ ...prev, status }));
      toast.success(status === 'confirmed' ? 'Match confirmed!' : 'Match rejected');
    } catch {
      toast.error('Failed to update match');
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 gap-6">
        <SkeletonCard /><SkeletonCard />
      </div>
    </div>
  );

  if (!match) return (
    <div className="text-center py-20">
      <p className="text-surface-500">Match not found</p>
      <Link to="/dashboard?tab=matches" className="text-primary-500 mt-2 inline-block">Go back</Link>
    </div>
  );

  const score = Math.round((match.combinedScore || 0) * 100);
  const textScore = Math.round((match.textScore || 0) * 100);
  const imageScore = Math.round((match.imageScore || 0) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <Link to="/dashboard?tab=matches" className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-500 mb-6 transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Matches
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Match Comparison</h1>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-500 bg-clip-text text-transparent">
                {score}%
              </div>
              <div className="text-sm text-surface-500">Combined Score</div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">{textScore}%</div>
              <div className="text-xs text-surface-400">Text Match</div>
            </div>
            <div className="w-px h-8 bg-surface-200 dark:bg-surface-700" />
            <div className="text-center">
              <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">{imageScore}%</div>
              <div className="text-xs text-surface-400">Image Match</div>
            </div>
          </div>

          {/* Full-width progress bar */}
          <div className="max-w-md mx-auto mt-4">
            <div className="w-full h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
              <div className="match-bar h-3" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        {/* Side by side */}
        <div className="grid md:grid-cols-2 gap-6">
          <ItemDetailCard item={match.lostItem} label="Lost Item" color="red" showContact={showContact} />
          <ItemDetailCard item={match.foundItem} label="Found Item" color="blue" showContact={showContact} />
        </div>

        {!showContact && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-6 rounded-2xl bg-primary-500/5 border border-primary-500/20 text-center"
          >
            <HiShieldCheck className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Secure Contact Sharing</h3>
            <p className="text-surface-600 dark:text-surface-400 mb-6 max-w-md mx-auto">
              Your contact information is encrypted. Click the button below to reveal contact details and connect with the other party.
            </p>
            <button
              onClick={() => setShowContact(true)}
              className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
            >
              Reveal Contact Details
            </button>
          </motion.div>
        )}

        {/* Actions */}
        {match.status === 'pending' && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => handleAction('confirmed')}
              className="px-8 py-3 bg-success text-white font-semibold rounded-xl hover:bg-emerald-600 shadow-lg shadow-success/20 transition-all"
            >
              ✓ Confirm Match
            </button>
            <button
              onClick={() => handleAction('rejected')}
              className="px-8 py-3 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 font-semibold rounded-xl hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
            >
              ✕ Not a Match
            </button>
          </div>
        )}

        {match.status !== 'pending' && (
          <div className={`text-center mt-8 py-4 rounded-xl font-semibold
            ${match.status === 'confirmed'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {match.status === 'confirmed' ? '✓ Match Confirmed' : '✕ Match Rejected'}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ItemDetailCard({ item, label, color, showContact }) {
  if (!item) return null;
  const borderColor = color === 'red' ? 'border-red-300 dark:border-red-800' : 'border-blue-300 dark:border-blue-800';
  const badgeColor = color === 'red' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`rounded-2xl border-2 ${borderColor} overflow-hidden bg-surface-100`}>
      {/* Badge */}
      <div className={`px-4 py-2 ${badgeColor} text-white text-sm font-semibold`}>
        {label}
      </div>

      {/* Image */}
      <div className="h-56 bg-surface-100 dark:bg-surface-800">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-400">
            <HiPhotograph className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 space-y-3">
        <h3 className="text-xl font-bold text-surface-900 dark:text-white">{item.title}</h3>
        <p className="text-sm text-surface-500">{item.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
            <span className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium">
              {getCategoryLabel(item.category)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-surface-500">
            <HiCalendar className="w-4 h-4" /> {formatDate(item.date)}
          </div>

          {item.location?.text && (
            <div className="flex items-center gap-2 text-surface-500">
              <HiLocationMarker className="w-4 h-4" /> {item.location.text}
            </div>
          )}

          {/* Contact info */}
          {item.user && (
            <div className="pt-3 mt-3 border-t border-surface-200 dark:border-surface-700 space-y-1.5">
              <h3 className="font-semibold text-surface-700 dark:text-surface-300">Contact Details</h3>
              {showContact ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="font-medium text-surface-800 dark:text-surface-200">{item.contactName || item.user.name}</p>
                  <div className="space-y-1 mt-1">
                    <a href={`mailto:${item.contactEmail || item.user.email}`} className="flex items-center gap-2 text-primary-500 hover:underline text-sm">
                      <HiMail className="w-4 h-4" /> {item.contactEmail || item.user.email}
                    </a>
                    {item.contactPhone && (
                      <a href={`tel:${item.contactPhone}`} className="flex items-center gap-2 text-primary-500 hover:underline text-sm">
                        <HiPhone className="w-4 h-4" /> {item.contactPhone}
                      </a>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2 py-2 px-3 bg-surface-200 dark:bg-surface-800 rounded-lg text-xs text-surface-500 italic">
                  <HiLockClosed className="w-3.5 h-3.5" />
                  Details hidden for privacy
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
