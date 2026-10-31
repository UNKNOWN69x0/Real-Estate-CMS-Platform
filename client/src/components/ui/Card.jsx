export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}
