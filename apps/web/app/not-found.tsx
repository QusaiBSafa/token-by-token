import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap section">
      <p className="eyebrow">404</p>
      <h1>This page has no tokens.</h1>
      <p className="prose-narrow">We couldn’t find what you were looking for. Try the course map, or search with Ctrl K.</p>
      <Link className="btn btn-primary" href="/learn">Go to the course map</Link>
    </main>
  );
}
