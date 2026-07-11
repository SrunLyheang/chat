// Animated gilded border shell — colors come from the theme CSS variables so
// it restyles with the active theme.
function BorderAnimatedContainer({ children }) {
  return (
    <div className="w-full h-full [background:linear-gradient(45deg,rgb(var(--ground)),rgb(var(--surface))_50%,rgb(var(--ground)))_padding-box,conic-gradient(from_var(--border-angle),rgb(var(--edge)/.48)_80%,rgb(var(--primary))_86%,rgb(var(--primary)/.6)_90%,rgb(var(--primary))_94%,rgb(var(--edge)/.48))_border-box] rounded-2xl border border-transparent animate-border flex overflow-hidden">
      {children}
    </div>
  );
}
export default BorderAnimatedContainer;
