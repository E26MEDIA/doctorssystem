"use client";

import { usePathname } from "next/navigation";
import { whatsappHref } from "@/lib/clinic";

export function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp enquiry with Dr. S S Honnani"
      className="whatsapp-fab group"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden>
        <path d="M19.11 17.47c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.11 2.84c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32z" />
        <path d="M16.02 3C8.83 3 3 8.82 3 16c0 2.3.61 4.45 1.67 6.31L3 29l6.84-1.63A12.94 12.94 0 0 0 16.02 29C23.2 29 29 23.18 29 16S23.2 3 16.02 3zm0 23.67c-2.12 0-4.09-.62-5.74-1.69l-.41-.26-4.06.97 1.04-3.96-.27-.43A10.64 10.64 0 0 1 5.33 16c0-5.9 4.8-10.69 10.69-10.69S26.71 10.1 26.71 16s-4.8 10.67-10.69 10.67z" />
      </svg>
      <span className="whatsapp-fab-label">WhatsApp query</span>
    </a>
  );
}
