// Khmer brand marks — inline SVGs that inherit currentColor, so they follow
// the active theme automatically. Used on the auth pages and around the app.

// Stylized lotus blossom — the Chatle logo mark.
export function LotusMark({ className }) {
  return (
    <svg viewBox="0 0 48 42" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M24 4c2.6 4 3.9 8.4 3.9 13.2 0 1.6-.2 3.1-.5 4.6-1-.9-2.1-2.3-3.4-4.3-1.3 2-2.4 3.4-3.4 4.3-.3-1.5-.5-3-.5-4.6C20.1 12.4 21.4 8 24 4z"
      />
      <path
        fill="currentColor"
        opacity=".8"
        d="M24 22c-2.9-2.4-6-3.8-9.4-4.2 0 3.8 1.3 7.1 3.9 9.9 1.6 1.7 3.5 2.9 5.5 3.7 2-.8 3.9-2 5.5-3.7 2.6-2.8 3.9-6.1 3.9-9.9-3.4.4-6.5 1.8-9.4 4.2z"
      />
      <path
        fill="currentColor"
        opacity=".55"
        d="M24 30C19.6 27 14.6 25.7 9 26c1.2 4.6 4 8 8.4 10 2.2 1 4.4 1.5 6.6 1.6 2.2-.1 4.4-.6 6.6-1.6 4.4-2 7.2-5.4 8.4-10-5.6-.3-10.6 1-15 4z"
      />
    </svg>
  );
}

// Angkor Wat five-tower silhouette — used as a subtle watermark.
export function AngkorSilhouette({ className }) {
  return (
    <svg viewBox="0 0 230 92" className={className} aria-hidden="true">
      <path fill="currentColor" d="M4 88h222v4H4z" />
      <path fill="currentColor" d="M8 80h214v6H8z" />
      <path fill="currentColor" d="M115 8c4 8 7 14 7 22 0 10-3 18-7 26-4-8-7-16-7-26 0-8 3-14 7-22z" />
      <path fill="currentColor" d="M66 26c3 6 5 10 5 16 0 8-2 14-5 20-3-6-5-12-5-20 0-6 2-10 5-16z" />
      <path fill="currentColor" d="M164 26c3 6 5 10 5 16 0 8-2 14-5 20-3-6-5-12-5-20 0-6 2-10 5-16z" />
      <path fill="currentColor" d="M30 40c2.4 5 4 8 4 13 0 6-1.6 11-4 16-2.4-5-4-10-4-16 0-5 1.6-8 4-13z" />
      <path fill="currentColor" d="M200 40c2.4 5 4 8 4 13 0 6-1.6 11-4 16-2.4-5-4-10-4-16 0-5 1.6-8 4-13z" />
    </svg>
  );
}

// Kbach ornamental divider — used to separate sections on the auth pages.
export function KbachDivider({ className }) {
  return (
    <svg viewBox="0 0 260 22" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M6 15h70c8 0 6-13 16-13 8 0 9 8 32 8s24-8 32-8c10 0 8 13 16 13h70"
      />
      <circle cx="130" cy="4" r="3" fill="currentColor" />
      <circle cx="46" cy="9" r="2" fill="currentColor" />
      <circle cx="214" cy="9" r="2" fill="currentColor" />
    </svg>
  );
}
