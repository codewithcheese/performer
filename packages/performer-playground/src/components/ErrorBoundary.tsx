import { useRouteError } from "react-router-dom";

export function ErrorBoundary() {
  const error = useRouteError() as any;
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="relative">
        <div className="text-4xl">{error.status}</div>
        <div>{error.data || error.message || "Unknown error"}</div>
        {error.status === 404 && (
          <div className="pt-2">
            <a className="underline" href="/">
              Go to home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
