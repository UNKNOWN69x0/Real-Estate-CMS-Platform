const STYLES = {
  published: 'bg-green-100 text-green-800',
  draft: 'bg-amber-100 text-amber-800',
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-amber-100 text-amber-800',
  closed: 'bg-stone-200 text-stone-700',
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  publish: 'bg-green-100 text-green-800',
  unpublish: 'bg-amber-100 text-amber-800',
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${STYLES[value] ?? 'bg-stone-200 text-stone-700'}`}>
      {value}
    </span>
  );
}
