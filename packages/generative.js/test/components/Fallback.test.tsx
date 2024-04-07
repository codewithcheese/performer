/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  Fallback,
  GenerativeMessage,
  GenerativeProvider,
  Message,
  readTextContent,
  System,
  User,
} from "../../src/index.js";
import { Fragment, ReactNode, useCallback, useState } from "react";
import { render } from "@testing-library/react";
import { getGenerative, UseGenerative } from "../util/UseGenerative.js";

test("should fallback from system to assistant then user listening", async () => {
  function App() {
    const [elements, setElements] = useState<ReactNode[]>([
      <System content="A">{readTextContent}</System>,
    ]);

    const handleFallback = useCallback(
      (message: GenerativeMessage) => {
        if (message.role === "assistant") {
          setElements((e) => e.concat(<User />));
        } else {
          setElements((e) =>
            e.concat(
              <Message type={{ role: "assistant", content: "B" }}>
                {readTextContent}
              </Message>,
            ),
          );
        }
      },
      [setElements],
    );

    return (
      <GenerativeProvider options={{ logLevel: "debug" }}>
        <UseGenerative />
        <Fallback handler={handleFallback}>
          {elements.map((element, i) => (
            <Fragment key={i}>{element}</Fragment>
          ))}
        </Fallback>
      </GenerativeProvider>
    );
  }

  const { container } = render(<App />);
  const generative = getGenerative()!;
  await generative.waitUntilSettled();
  expect(generative.state).toEqual("listening");
  expect(container.textContent).toEqual("AB");
});
