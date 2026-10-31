import { Link, useLocation } from "react-router-dom";

export default function PageNotFound() {
  const location = useLocation();
  return (
    <div className="grid min-h-[65vh] place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl text-muted-foreground/40">404</p>
        <h1 className="mt-3 font-display text-2xl">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">There is no page at <span className="font-medium">{location.pathname}</span>.</p>
        <Link to="/" className="mt-5 inline-flex rounded-xl bg-ink px-4 py-2 text-sm text-paper">Back to the scheme assistant</Link>
      </div>
    </div>
  );
}
