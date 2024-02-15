import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { Logo } from "./components/Logo";
import logo from "assets/performer-no-fill-no-thumbs-min-3.png";
import Image from "next/image";

const config: DocsThemeConfig = {
  logo: (
    <div className="flex flex-row items-center gap-2">
      <Image alt="logo-small" src={logo} width="40" height="40" />
      {/*<div className="text-xl">Performer</div>*/}
    </div>
  ),
  project: {
    link: "https://github.com/codewithcheese/performer",
  },
  chat: {
    link: "https://discord.com",
  },
  docsRepositoryBase:
    "https://github.com/codewithcheese/performer/tree/master/packages/performer.dev",
  footer: {
    text: "",
  },
};

export default config;
