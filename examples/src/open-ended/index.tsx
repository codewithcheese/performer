import { Assistant, createTool, Repeat, User, useState } from "@performer/core";
import { z } from "zod";

export const name = "Chat until goodbye";

const ByeSchema = z
  .object({})
  .describe(
    "When the the conversation naturally ends, for example when the user says goodbye or asks to end the chat",
  );

export function App() {
  const stopped = useState(false);
  const tool = createTool("endOfConversation", ByeSchema, () => {
    stopped.value = true;
  });
  return () => (
    <>
      <system>Greet the user.</system>
      <Assistant />
      <Repeat stop={stopped}>
        <User />
        <Assistant tools={[tool]} />
      </Repeat>
      <system>
        Say goodbye to the user with a joke related to the conversation. Use
        emojis.
      </system>
      <Assistant />
    </>
  );
}
