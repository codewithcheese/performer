import { useState } from "react";

export function ModelSelect() {
  const [show] = useState(false);
  return (
    show && (
      <div className="sticky top-0 z-10 mb-1.5 flex h-14 items-center justify-between bg-white p-2 font-semibold dark:bg-gray-800">
        <div className="absolute left-1/2 -translate-x-1/2"></div>
        <div className="flex items-center gap-2">
          <div
            className="radix-state-open:bg-gray-50 dark:radix-state-open:bg-black/20 group flex cursor-pointer items-center gap-1 rounded-xl px-3 py-2 text-lg font-medium hover:bg-gray-50 dark:hover:bg-black/10"
            id="radix-:rh:"
            aria-haspopup="menu"
            aria-expanded="false"
            data-state="closed"
          >
            <div>
              Model <span className="text-token-text-secondary">version</span>
            </div>
            <svg
              width="16"
              height="17"
              viewBox="0 0 16 17"
              fill="none"
              className="text-token-text-tertiary"
            >
              <path
                d="M11.3346 7.83203L8.00131 11.1654L4.66797 7.83203"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
          </div>
        </div>
        <div className="flex gap-2 pr-1"></div>
      </div>
    )
  );
}
