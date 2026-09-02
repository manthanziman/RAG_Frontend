export default function LoadingSpinner({
  label = "Loading...",
  size = "medium",
}) {
  return (
    <div
      className={`loading-inline loading-inline-${size}`}
      role="status"
      aria-live="polite"
    >
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
