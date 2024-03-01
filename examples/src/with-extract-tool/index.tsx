import { Assistant, createTool } from "@performer/core";
import { z } from "zod";

export const name = "Data extraction tool";

const PeopleSchema = z
  .object({
    people: z.array(
      z.object({
        name: z.string(),
        age: z.number(),
      }),
    ),
  })
  .describe(
    "Extract and save the relevant entities mentioned in the user together with\n" +
      "their properties. If a property is not present and is not required in the function\n" +
      "parameters, do not include it in the output.",
  );

export function App() {
  const extractTool = createTool("extract", PeopleSchema);
  return () => (
    <>
      <system>
        Extract and save the relevant entities mentioned in the user together
        with their properties. If a property is not present and is not required
        in the function parameters, do not include it in the output.
      </system>
      <user>jane is 2 and bob is 3</user>
      <Assistant
        model="gpt-3.5-turbo-1106"
        toolChoice={extractTool}
        tools={[extractTool]}
      />
    </>
  );
}
