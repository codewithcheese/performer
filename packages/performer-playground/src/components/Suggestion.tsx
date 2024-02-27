export function Suggestion() {
  return (
    <span data-projection-id="4">
      <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
        <div className="flex w-full items-center justify-center gap-2">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <div className="truncate">Recommend a dish</div>
              <div className="truncate font-normal opacity-50">
                to impress a date who's a picky eater
              </div>
            </div>
            <div className="absolute bottom-0 right-0 top-0 flex items-center rounded-xl bg-gradient-to-l from-gray-50 from-[60%] pl-6 pr-4 text-gray-700 opacity-0 group-hover:opacity-100 dark:from-gray-700 dark:text-gray-200">
              <span className="" data-state="closed">
                <div className="bg-token-surface-primary shadow-xxs rounded-lg p-1 dark:shadow-none">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="icon-sm text-token-text-primary"
                  >
                    <path
                      d="M7 11L12 6L17 11M12 18V7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                </div>
              </span>
            </div>
          </div>
        </div>
      </button>
    </span>
  );
}
