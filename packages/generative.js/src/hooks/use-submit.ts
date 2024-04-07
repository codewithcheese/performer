import { useContext } from "react";
import { GenerativeContext } from "../index.js";

export function useSubmit(role: "user" | "assistant" | "system" = "user") {
  const { generative } = useContext(GenerativeContext);
  return (content: string) => {
    generative.submit({ role, content });
  };
}
