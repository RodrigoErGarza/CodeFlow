// app/components/WindowCard.tsx
import type { ReactNode } from "react";

export default function WindowCard({
  title = "code.tsx",
  children,
  footer,
}: {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative rounded-[22px] p-[1px] bg-gradient-to-r from-[#6a3df5] to-[#1ea1ff] shadow-[0_30px_100px_-30px] shadow-black/60">
      <div className="rounded-[22px] bg-[#0D1321]/90 backdrop-blur border border-white/10">
        {/* chrome bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="text-sm text-white/70 font-medium">{title}</div>
          <div className="w-14" />
        </div>

        {/* content */}
        <div className="p-6 md:p-8">{children}</div>

        {footer && (
          <div className="px-6 md:px-8 py-4 border-t border-white/10">{footer}</div>
        )}
      </div>
    </div>
  );
}
