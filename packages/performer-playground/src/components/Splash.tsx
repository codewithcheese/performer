import { useState } from "react";

export function Splash() {
  const [show] = useState(false);
  return (
    show && (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="relative">
          <div className="mb-3 h-[72px] w-[72px]">
            <div className="gizmo-shadow-stroke relative flex h-full items-center justify-center rounded-full bg-white text-black">
              Performer
            </div>
          </div>
        </div>
      </div>
    )
  );
}
