import { createLazyFileRoute } from "@tanstack/react-router";
import { Generative, System } from "generative.js";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Generative options={{ logLevel: "debug" }}>
      <System content="Greet the user" />
    </Generative>
  );
}
