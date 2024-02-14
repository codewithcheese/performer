import { Assistant, Repeat, User } from "@performer/core";

export function App() {
  return () => (
    <>
      <system>Greet the user.</system>
      <Repeat>
        <Assistant />
        <User />
      </Repeat>
    </>
  );
}
