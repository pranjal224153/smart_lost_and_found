export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-surface-100 dark:bg-surface-800/50 w-fit">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === tab.value
              ? 'bg-surface-50 dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}
        >
          {tab.label}
          {tab.count != null && (
            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs
              ${activeTab === tab.value
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
              }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
