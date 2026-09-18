"use client";

import { usePathname } from "next/navigation";

export default function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-[fadeInPage_0.2s_ease-out]">
      {children}
    </div>
  );
}
