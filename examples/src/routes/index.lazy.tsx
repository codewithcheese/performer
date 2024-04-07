import { createLazyFileRoute } from "@tanstack/react-router";
import { Assistant, readTextContent, System } from "generative.js";
import { Fragment, ReactNode, useState } from "react";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const [inserts, setInserts] = useState<ReactNode[]>([]);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setInserts((i) =>
            i.concat(
              <Fragment key={i.length - 1}>
                <System content="Tell a joke about Typescript" />
                <Assistant>{readTextContent}</Assistant>
              </Fragment>,
            ),
          );
        }}
      >
        Joke
      </button>
      <System content="Greet the user">{readTextContent}</System>
      <Assistant>{readTextContent}</Assistant>
      {inserts}
    </>
  );
}
