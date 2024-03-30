import { useContext, useEffect, useState } from "react";
import { GenerativeContext } from "../components/Generative.js";

export function useSubmit(role: "user" | "assistant" | "system" = "user") {
  const { performer } = useContext(GenerativeContext);
  return (content: string) => {
    performer.submit({ role, content });
  };
}
