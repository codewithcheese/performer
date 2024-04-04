/* @vitest-environment jsdom */
import { expect, test } from "vitest";
import {
  Append,
  Decision,
  Generative,
  Goto,
  Message,
  readTextContent,
  Router,
  Routes,
  System,
  useRouteData,
} from "../../src/index.js";
import { render } from "@testing-library/react";
import { getPerformer, UsePerformer } from "../util/UsePerformer.js";
import { sleep } from "../../src/util/sleep.js";

test("should display / then goto /second", async () => {
  function First() {
    return (
      <>
        <System content="A">{readTextContent}</System>
        <Message
          type={() => {
            // wait for async action before Goto
            sleep(100);
          }}
        >
          <Goto path="/second" data="B" />
        </Message>
      </>
    );
  }
  function Second() {
    const data = useRouteData();
    return <System content={data}>{readTextContent}</System>;
  }
  const routes: Routes = [
    { path: "/", component: <First /> },
    { path: "/second", component: <Second /> },
  ];
  const { findByText, container } = render(
    <Generative>
      <UsePerformer />
      <Router routes={routes} />
    </Generative>,
  );
  await findByText("A");
  await findByText("B");
  // only B should be visible
  const elements = container.querySelectorAll("[data-performer-id]");
  expect(elements).toHaveLength(1);
});

test("should display / then append /second", async () => {
  function First() {
    return (
      <>
        <System content="A">{readTextContent}</System>
        <Message
          type={() => {
            // wait for async action before Goto
            sleep(100);
          }}
        >
          <Append path="/second" data="B" />
        </Message>
      </>
    );
  }
  function Second() {
    const data = useRouteData();
    return <System content={data}>{readTextContent}</System>;
  }
  const routes: Routes = [
    { path: "/", component: <First /> },
    { path: "/second", component: <Second /> },
  ];
  const { findByText, container } = render(
    <Generative>
      <UsePerformer />
      <Router routes={routes} />
    </Generative>,
  );
  await findByText("A");
  await findByText("B");
  // both A and B should be visible
  console.log(container.innerHTML);
  const elements = container.querySelectorAll("[data-performer-id]");
  expect(elements).toHaveLength(3); // 3 including async Message
});

test("should display / and then use Decision to append /second", async () => {
  function First() {
    return (
      <>
        <System content="A">{readTextContent}</System>
        <Message
          type={() => {
            // wait for async action before Goto
            sleep(100);
          }}
        >
          <Decision instruction="Select /second" operation="append" />
        </Message>
      </>
    );
  }
  function Second() {
    return <System content={"B"}>{readTextContent}</System>;
  }
  const routes: Routes = [
    { path: "/", component: <First /> },
    { path: "/second", component: <Second /> },
  ];
  const { findByText, container } = render(
    <Generative>
      <UsePerformer />
      <Router routes={routes} />
    </Generative>,
  );
  const performer = getPerformer()!;
  await performer.waitUntilSettled();
  await findByText("A");
  await findByText("B");
});
