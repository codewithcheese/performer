/// <reference types="vite-plugin-svgr/client" />
import { useState } from "react";
import { AppImport } from "../lib/import.js";
import DefaultPerformerIcon from "../icons/DefaultPerformerIcon.svg?react";
import { Link, Outlet, useLoaderData } from "react-router-dom";

export function Root({ apps }: { apps: AppImport[] }) {
  return (
    <div className="relative z-0 flex h-full w-full overflow-hidden">
      <div
        className="flex-shrink-0 overflow-x-hidden bg-token-sidebar-surface-primary"
        style={{ width: 260 }}
      >
        <div className="h-full w-[260px]">
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex h-full min-h-0 flex-col transition-opacity opacity-100">
              <div className="scrollbar-trigger relative h-full w-full flex-1 items-start border-white/20">
                <nav className="flex h-full w-full flex-col px-3 pb-3.5">
                  <div className="flex-col flex-1 transition-opacity duration-500 -mr-2 pr-2 overflow-y-auto">
                    <div className="sticky left-0 right-0 top-0 z-20 pt-3.5">
                      {/*<div className="pb-0.5 last:pb-0">*/}
                      {/*  <a*/}
                      {/*    href="/"*/}
                      {/*    className="group flex h-10 items-center gap-2 rounded-lg bg-token-sidebar-surface-primary px-2 font-medium hover:bg-token-sidebar-surface-secondary"*/}
                      {/*  >*/}
                      {/*    <div className="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm text-token-text-primary">*/}
                      {/*      Performer*/}
                      {/*    </div>*/}
                      {/*  </a>*/}
                      {/*</div>*/}
                    </div>
                    <div>
                      {apps.map((app, index) => {
                        return (
                          <div
                            key={index}
                            className="pb-0.5 last:pb-0"
                            tabIndex={0}
                          >
                            <Link
                              className="group flex h-10 items-center gap-2 rounded-lg bg-token-sidebar-surface-primary px-2 font-medium hover:bg-token-sidebar-surface-secondary"
                              to={app.slug}
                            >
                              <div className="h-7 w-7 flex-shrink-0">
                                <div className="gizmo-shadow-stroke relative flex h-full items-center justify-center rounded-full bg-white text-gray-950">
                                  <DefaultPerformerIcon />
                                </div>
                              </div>
                              <div className="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm text-token-text-primary">
                                {app.name}
                              </div>
                              {/*<div className="flex gap-3">*/}
                              {/*  <span*/}
                              {/*    className="flex items-center"*/}
                              {/*    data-state="closed"*/}
                              {/*  >*/}
                              {/*    <button className="text-token-text-primary">*/}
                              {/*      <EditIcon />*/}
                              {/*    </button>*/}
                              {/*  </span>*/}
                              {/*</div>*/}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
