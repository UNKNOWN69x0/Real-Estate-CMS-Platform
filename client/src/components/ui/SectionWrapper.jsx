// Page section with a consistent container; scroll-mt keeps anchors clear of the sticky navbar.
export default function SectionWrapper({ id, className = '', containerClassName = '', children }) {
  return (
    <section id={id} className={`relative scroll-mt-14 overflow-hidden ${className}`}>
      <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${containerClassName}`}>{children}</div>
    </section>
  );
}
