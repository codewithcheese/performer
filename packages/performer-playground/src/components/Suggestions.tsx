export function Suggestions() {
  return (
    <div>
      <div className="ml-1 flex h-full justify-center gap-0 md:m-auto md:mb-4 md:w-full md:gap-2">
        <div className="grow">
          <div className="absolute bottom-full left-0 mb-4 flex w-full grow gap-2 px-1 pb-1 sm:px-2 sm:pb-0 md:static md:mb-0 md:max-w-none">
            <div className="grid w-full grid-flow-row grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-2">
              <div className="flex flex-col gap-2">
                <span data-projection-id="5">
                  <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
                    <div className="flex w-full items-center justify-center gap-2">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                          <div className="truncate">Suggest some names</div>
                          <div className="truncate font-normal opacity-50">
                            for my cafe-by-day, bar-by-night business
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
              </div>
              <div className="flex flex-col gap-2">
                <span data-projection-id="6">
                  <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
                    <div className="flex w-full items-center justify-center gap-2">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                          <div className="truncate">Come up with concepts</div>
                          <div className="truncate font-normal opacity-50">
                            for a retro-style arcade game
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
                <span data-projection-id="7">
                  <button className="btn btn-neutral group relative w-full whitespace-nowrap rounded-xl px-4 py-3 text-left text-gray-700 dark:text-gray-300 md:whitespace-normal">
                    <div className="flex w-full items-center justify-center gap-2">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex flex-col overflow-hidden">
                          <div className="truncate">Show me a code snippet</div>
                          <div className="truncate font-normal opacity-50">
                            of a website's sticky header
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
