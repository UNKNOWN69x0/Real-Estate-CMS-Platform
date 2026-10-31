const variants = {
  primary: 'bg-brown-700 text-white border-brown-700 hover:bg-brown-800 hover:border-brown-800',
  light: 'bg-cream/90 text-brown-700 border-cream/90 hover:bg-white',
  glass: 'bg-white/25 text-white border-white/30 backdrop-blur-sm hover:bg-white/35',
  outline: 'bg-transparent text-white border-white/70 hover:bg-white/10',
  ghost: 'bg-white text-brown-700 border-brown-400/60 hover:bg-sand',
  danger: 'bg-red-700 text-white border-red-700 hover:bg-red-800 hover:border-red-800',
};

const sizes = {
  md: 'px-5 py-3 text-[0.7rem]',
  sm: 'px-3 py-2 text-[0.65rem]',
};

const base =
  'inline-flex items-center justify-center gap-2 border font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60';

// Renders an <a> when given href, otherwise a <button>
export default function Button({ variant = 'primary', size = 'md', href, className = '', children, ...props }) {
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
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
