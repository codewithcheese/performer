import { useCallback, useContext } from "react";
import { GenerativeContext } from "../index.js";

export function useSubmit() {
  const { generative } = useContext(GenerativeContext);
  return useCallback(
    (role: "user" | "assistant" | "system", content: string) => {
      generative.submit({ role, content });
    },
    [generative],
  );
}
