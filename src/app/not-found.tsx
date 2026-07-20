import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center px-5 pt-28">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--teal)]">404</p>
      <h1 className="display mt-3 text-5xl">Page not found</h1>
      <p className="mt-4 text-lg text-[var(--ink-soft)]">
        That page isn’t part of the clinic site. Head home or book a visit.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/book" className="btn-ghost">
          Book
        </Link>
      </div>
    </div>
  );
}
