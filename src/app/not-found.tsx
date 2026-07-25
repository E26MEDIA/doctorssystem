import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 pt-28 pb-20">
      <div className="max-w-lg text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">404</p>
        <h1 className="display mt-3 text-5xl">Page not found</h1>
        <p className="mt-4 text-lg text-[var(--ink-soft)]">
          That page is unavailable. Return home or book a consultation with Dr. Honnani.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/#book" className="btn-ghost">
            Book appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
