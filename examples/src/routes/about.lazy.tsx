import { createLazyFileRoute } from "@tanstack/react-router";
import { Generative, System, readTextContent } from "generative.js";

export const Route = createLazyFileRoute("/about")({
  component: About,
});

function About() {
  return <System content="About yourself">{readTextContent}</System>;
}
