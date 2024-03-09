export function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="relative items-center">
        <div className="mb-3 m-auto h-[100px] w-[100px]">
          <div className="gizmo-shadow-stroke relative flex h-full items-center justify-center rounded-full bg-white text-black p-4 overflow-hidden">
            <img width="98" height="98" src="/public/performer-128.png" />
          </div>
        </div>
      </div>
    </div>
  );
}
