import { redirect } from "next/navigation";

/** Booking lives on the home page (#book) — no separate booking page. */
export default function BookPage() {
  redirect("/#book");
}
