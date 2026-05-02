import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowLeft, HiArrowRight, HiCheck } from 'react-icons/hi';
import ImageUpload from '../components/forms/ImageUpload';
import { CATEGORIES } from '../utils/helpers';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 'details', title: 'Item Details', desc: 'What did you lose/find?' },
  { id: 'image', title: 'Photo', desc: 'Upload an image' },
  { id: 'location', title: 'Location', desc: 'Where was it?' },
  { id: 'contact', title: 'Contact', desc: 'How to reach you?' },
  { id: 'review', title: 'Review', desc: 'Confirm & submit' },
];

export default function ReportItem() {
  const { type } = useParams(); // 'lost' or 'found'
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    locationText: '',
    locationLat: '',
    locationLng: '',
    venue: '',
    storageLocation: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!form.title.trim()) { toast.error('Title is required'); return false; }
        if (!form.description.trim()) { toast.error('Description is required'); return false; }
        if (!form.category) { toast.error('Category is required'); return false; }
        if (!form.date) { toast.error('Date is required'); return false; }
        return true;
      case 1: return true; // Image is optional
      case 2:
        if (!form.locationText.trim()) { toast.error('Location is required'); return false; }
        return true;
      case 3:
        if (!form.contactName.trim()) { toast.error('Contact name is required'); return false; }
        if (!form.contactEmail.trim()) { toast.error('Contact email is required'); return false; }
        return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) setStep(p => Math.min(p + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep(p => Math.max(p - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      if (imageFile) formData.append('image', imageFile);

      await api.post('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`${type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  const isLost = type === 'lost';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-white mb-1">
          Report {isLost ? 'Lost' : 'Found'} Item
        </h1>
        <p className="text-surface-500 mb-8">Fill in the details to {isLost ? 'find your item' : 'help someone find their item'}.</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                ${i === step
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : i < step
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                }`}
              onClick={() => i < step && setStep(i)}
            >
              {i < step ? <HiCheck className="w-4 h-4" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-0.5 mx-1 ${i < step ? 'bg-primary-400' : 'bg-surface-200 dark:bg-surface-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Steps */}
      <div className="bg-surface-100 border border-surface-200 dark:border-surface-800 p-6 sm:p-8 shadow-sm rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    placeholder={isLost ? 'e.g. Black iPhone 15 Pro' : 'e.g. Found a set of keys'}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    rows={4}
                    placeholder="Describe the item in detail — color, brand, distinguishing features..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Category *</label>
                    <select
                      value={form.category}
                      onChange={e => update('category', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 cursor-pointer"
                    >
                      <option value="">Select</option>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>
                          {c.icon} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => update('date', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <p className="text-sm text-surface-500 mb-4">A photo greatly increases match accuracy. Upload an image of the item or a similar one.</p>
                <ImageUpload
                  file={imageFile}
                  preview={imagePreview}
                  onFileChange={(f, p) => { setImageFile(f); setImagePreview(p); }}
                  onClear={() => { setImageFile(null); setImagePreview(''); }}
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    {isLost ? 'Where did you lose it?' : 'Where did you find it?'} *
                  </label>
                  <input
                    type="text"
                    value={form.locationText}
                    onChange={e => update('locationText', e.target.value)}
                    placeholder="e.g. Central Park, near the fountain"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                  />
                </div>
                {!isLost && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Venue / Building</label>
                      <input
                        type="text"
                        value={form.venue}
                        onChange={e => update('venue', e.target.value)}
                        placeholder="e.g. Library 2nd floor"
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Storage Location</label>
                      <input
                        type="text"
                        value={form.storageLocation}
                        onChange={e => update('storageLocation', e.target.value)}
                        placeholder="e.g. Front desk at student center"
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={e => update('contactName', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={e => update('contactEmail', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={e => update('contactPhone', e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white">Review your submission</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <ReviewRow label="Type" value={type?.toUpperCase()} />
                  <ReviewRow label="Title" value={form.title} />
                  <ReviewRow label="Category" value={form.category} />
                  <ReviewRow label="Date" value={form.date} />
                  <ReviewRow label="Location" value={form.locationText} />
                  <ReviewRow label="Contact" value={form.contactName} />
                  <ReviewRow label="Email" value={form.contactEmail} />
                </div>
                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Image</p>
                    <img src={imagePreview} alt="Preview" className="rounded-xl h-40 object-cover" />
                  </div>
                )}
                <p className="text-sm text-surface-400 mt-2">
                  {form.description}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-800">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-md shadow-primary-600/20 transition-all"
            >
              Next <HiArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-success text-white rounded-xl hover:bg-emerald-600 shadow-md shadow-success/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <HiCheck className="w-4 h-4" /> Submit Report
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div>
      <span className="text-surface-400">{label}</span>
      <p className="font-medium text-surface-800 dark:text-surface-200">{value || '—'}</p>
    </div>
  );
}
