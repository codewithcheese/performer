import { ReactNode } from "react";

export function TitleBar({ children }: { children: ReactNode }) {
  return (
    <div className="group">
      <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100">
        {children}
      </div>
    </div>
  );
}
