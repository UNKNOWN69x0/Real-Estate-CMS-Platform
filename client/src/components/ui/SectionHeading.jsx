export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', className = '' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <header className={`${alignment} ${className}`}>
      {eyebrow && <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-brown-600">{eyebrow}</p>}
      {title && <h2 className="mt-3 text-3xl font-semibold leading-tight text-brown-700 sm:text-4xl">{title}</h2>}
      {subtitle && <p className="mt-2 text-sm italic text-brown-600">{subtitle}</p>}
    </header>
  );
}
