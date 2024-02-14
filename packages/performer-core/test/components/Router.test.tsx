import { expect, test, assert } from "vitest";
import {
  Goto,
  readTextContent,
  resolveMessages,
  Router,
  Routes,
  Performer,
  useRouteData,
} from "../../src/index.js";

test("should load root route by default and then goto /second", async () => {
  function First() {
    return () => (
      <>
        <system>Greet the user</system>
        <Goto path="/second" data="Hello World" />
      </>
    );
  }
  function Second() {
    const data = useRouteData<string>();
    return () => <system>{data.value}</system>;
  }
  const routes: Routes = [
    { path: "/", component: <First /> },
    { path: "/second", component: <Second /> },
  ];
  const app = <Router routes={routes} />;
  const performer = new Performer(app);
  performer.start();
  await performer.waitUntilSettled();
  assert(performer.root?.type instanceof Function);
  expect(performer.root?.type.name).toEqual("Router");
  assert(performer.root?.child?.type instanceof Function);
  expect(performer.root?.child?.type.name).toEqual("Second");
  const messages = resolveMessages(performer.root!);
  expect(readTextContent(messages[0])).toEqual("Hello World");
});

test("should append");

test("should decide");
