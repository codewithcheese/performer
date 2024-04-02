import { useContext } from "react";
import { GenerativeContext } from "../index.js";

export function useSubmit(role: "user" | "assistant" | "system" = "user") {
  const { performer } = useContext(GenerativeContext);
  return (content: string) => {
    performer.submit({ role, content });
  };
}
