import { useContext, useEffect, useState } from "react";
import { GenerativeContext } from "../components/Generative.js";

export function useSubmit(role: "user" | "assistant" | "system" = "user") {
  const { performer } = useContext(GenerativeContext);
  const [finalize, setFinalize] = useState(false);
  // todo how to finalize when submit before listening, maybe need an element based finalize instead of per hook
  useEffect(() => {
    if (finalize) {
      performer.finalize();
      setFinalize(false);
    }
  }, [finalize]);
  return (content: string) => {
    setFinalize(true);
    performer.submit({ role, content });
  };
}
