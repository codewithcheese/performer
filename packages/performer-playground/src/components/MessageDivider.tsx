export function MessageDivider({ message }: { message: string }) {
  return (
    <div className="flex items-center">
      <div className="border-token-border-secondary flex-grow border-b"></div>
      <div className="text-token-text-tertiary flex flex-shrink-0 items-center gap-2 px-2 py-6 text-sm">
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
        {message}
      </div>
      <div className="border-token-border-secondary flex-grow border-b"></div>
    </div>
  );
}
