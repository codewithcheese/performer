/* @vitest-environment jsdom */
import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Performer,
  PerformerMessage,
  Component,
  SystemMessage,
} from "../src/index.js";
import {
  createElement,
  FC,
  forwardRef,
  ForwardRefExoticComponent,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { MutableRefObject } from "react";
import { sleep } from "openai/core";

const performer = new Performer();

function getFiberFromRef(ref: MutableRefObject<any>): any {
  if (ref.current) {
    const fiberKey = Object.keys(ref.current).find((key) =>
      key.startsWith("__reactFiber"),
    );

    if (fiberKey) {
      return ref.current[fiberKey];
    }
  }

  return null;
}

export function findPreviousElement(
  element: HTMLElement,
  attrName: string = "data-performer-id",
): { id: string; type: "parent" | "sibling" } | null {
  // Check previous siblings
  let sibling = element.previousElementSibling;
  while (sibling) {
    const id = sibling.getAttribute(attrName);
    if (id != null) {
      return { id, type: "sibling" };
    }
    sibling = sibling.previousElementSibling;
  }

  // Check parent elements
  let parent = element.parentElement;
  while (parent) {
    const id = parent.getAttribute(attrName);
    if (id != null) {
      return { id, type: "parent" };
    }
    parent = parent.parentElement;
  }

  // No matching element found
  return null;
}

type WrapperProps = {
  id: string;
  children: ReactNode;
};

function usePerformer(action: Component<any>): FC<any> {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    // setIsPending(true);
    if (!ref.current) {
      throw Error("usePerformer: ref not set");
    }
    // todo validate that ref element has correctly set data-performer-id
    const previous = findPreviousElement(ref.current);
    performer.insert({
      id,
      type: action,
      previous,
      notify: () => setIsPending(false),
    });
    return () => {
      // performer.remove();
    };
  }, []);
  const Wrapper: FC<{ children: ReactNode; className: any }> = ({
    className,
    children,
  }) => {
    return (
      <div data-performer-id={id} ref={ref} className={className}>
        {!isPending && children}
      </div>
    );
  };
  console.log("system", "isPending", isPending);
  return Wrapper;
}

function Assistant({}) {}

function System({ content }: { content: string }) {
  const Wrapper = usePerformer(() => {
    return { role: "system", content };
  });

  return <Wrapper>{content}</Wrapper>;
}

it("renders correctly", async () => {
  const { findByText } = render(
    <>
      <System content="1" />
      <System content="2" />
    </>,
  );
  await findByText("2");
  // await sleep(1_000);
  const messages = performer.getAllMessages();
  console.log(messages);
});
