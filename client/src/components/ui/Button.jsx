const variants = {
  primary: 'bg-brown-700 text-white border-brown-700 hover:bg-brown-800 hover:border-brown-800',
  light: 'bg-cream/90 text-brown-700 border-cream/90 hover:bg-white',
  glass: 'bg-white/25 text-white border-white/30 backdrop-blur-sm hover:bg-white/35',
  outline: 'bg-transparent text-white border-white/70 hover:bg-white/10',
};

const base =
  'inline-flex items-center justify-center gap-2 border px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60';

// Renders an <a> when given href, otherwise a <button>
export default function Button({ variant = 'primary', href, className = '', children, ...props }) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
