import { expect, test } from "vitest";
import { Performer, resolveMessages, useState } from "../../src/index.js";

test("should create state signals using initial values", async () => {
  function App() {
    const age = useState(28);
    const name = useState(() => "Taylor");

    return () => (
      <system>
        The users name is {name.value}, they are {String(age.value)} years old.
      </system>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilFinished();
  const messages = resolveMessages(performer.root);
  expect(messages).toHaveLength(1);
  expect(messages[0]).toEqual({
    role: "system",
    content: "The users name is Taylor, they are 28 years old.",
  });
});

test("should throw when mutating state object property value", async () => {
  function App() {
    const user = useState({ name: "Taylor", age: 28 });
    return () => (
      <system
        onMessage={() => {
          // @ts-expect-error cannot assign to read only prop
          user.value.age = 29;
        }}
      >
        The users name is {user.value.name}, they are {String(user.value.age)}{" "}
        years old.
      </system>
    );
  }
  const performer = new Performer(<App />, { throwOnError: false });
  performer.start();
  await performer.waitUntilFinished();
  const messages = resolveMessages(performer.root);
  expect(messages[0]).toEqual({
    role: "system",
    content: "The users name is Taylor, they are 28 years old.",
  });
  expect(performer.errors).toHaveLength(1);
});

test("should update when re-assigning state object value", async () => {
  function App() {
    const user = useState({ name: "Taylor", age: 28 });
    return () => (
      <system
        onMessage={() => {
          user.value = { name: "Sam", age: 42 };
        }}
      >
        The users name is {user.value.name}, they are {String(user.value.age)}{" "}
        years old.
      </system>
    );
  }
  const performer = new Performer(<App />);
  performer.start();
  await performer.waitUntilFinished();
  const messages = resolveMessages(performer.root);
  expect(messages[0]).toEqual({
    role: "system",
    content: "The users name is Sam, they are 42 years old.",
  });
});
