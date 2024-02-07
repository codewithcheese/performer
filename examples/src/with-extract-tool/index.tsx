/**
 * Based on https://github.com/langchain-ai/langchain/blob/master/cookbook/extraction_openai_tools.ipynb
 */
import { Assistant, Tool } from "@performer/core";
import { z } from "zod";

class ExtractTool implements Tool {
  id = "extract_tool";
  name = "extract";
  description =
    "Extract and save the relevant entities mentioned in the user together with\n" +
    "their properties. If a property is not present and is not required in the function\n" +
    "parameters, do not include it in the output.";
  params = z.object({});

  async call(extraction: z.infer<typeof this.params>) {
    return {
      id: this.id,
      role: "tool" as const,
      content: `${JSON.stringify(extraction)}`,
    };
  }
}

class PeopleExtractionTool extends ExtractTool {
  params = z.object({
    people: z.array(
      z.object({
        name: z.string(),
        age: z.number(),
      }),
    ),
  });
}

export function App() {
  const tools = [new PeopleExtractionTool()];
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
        toolChoice={tools[0]}
        tools={tools}
      />
    </>
  );
}
