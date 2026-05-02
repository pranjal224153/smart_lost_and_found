export const CATEGORIES = [
  { value: 'electronics', label: 'Electronics', icon: '📱' },
  { value: 'documents', label: 'Documents', icon: '📄' },
  { value: 'keys', label: 'Keys', icon: '🔑' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
  { value: 'bag', label: 'Bag', icon: '🎒' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'jewelry', label: 'Jewelry', icon: '💍' },
  { value: 'pet', label: 'Pet', icon: '🐶' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

export function getCategoryLabel(value) {
  return CATEGORIES.find(c => c.value === value)?.label || value;
}
