import { Search } from 'lucide-react';

const control = 'border border-brown-400/50 bg-white px-3 py-2 text-sm text-brown-900 focus:border-brown-600 focus:outline-none focus:ring-1 focus:ring-brown-600';

// Search box + filter selects shared by every list page.
// filters: [{ name, label, value, onChange, options: [{ value, label }] }]
export default function Toolbar({ search, onSearch, searchPlaceholder = 'Search…', filters = [], children }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="relative block flex-1 sm:max-w-xs">
        <span className="sr-only">Search</span>
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brown-400" />
        <input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={searchPlaceholder} className={`${control} w-full pl-9`} />
      </label>
      {filters.map((filter) => (
        <label key={filter.name} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brown-700">
          {filter.label}
          {filter.type === 'date' ? (
            <input type="date" value={filter.value} onChange={(e) => filter.onChange(e.target.value)} className={`${control} font-normal normal-case tracking-normal`} />
          ) : (
            <select value={filter.value} onChange={(e) => filter.onChange(e.target.value)} className={`${control} font-normal normal-case tracking-normal`}>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
      {children}
    </div>
  );
}
