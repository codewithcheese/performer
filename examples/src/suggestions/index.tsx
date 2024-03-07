import { Repeat, User } from "@performer/core";
import { Assistant } from "@performer/core";
import { Thread } from "@performer/core";
import { createTool } from "@performer/core";
import { z } from "zod";

export const name = "Follow-up questions";

const followUpQuestions = createTool(
  "followUpQuestions",
  z.object({
    questions: z
      .string()
      .array()
      .describe(
        "Four (4) follow up questions to help the user find what the seek",
      ),
  }),
);

const suggestedTaskTool = createTool(
  "suggestPrompts",
  z.object({
    tasks: z.array(
      z.object({
        taskCommand: z.string().describe("1-3 words command"),
        taskDetail: z.string().describe("A concise sentence"),
      }),
    ),
  }),
);

export function App() {
  return () => (
    <>
      <system>You are a helpful AI assistant. Be concise.</system>
      <Thread>
        <system>
          The user has the following interests. A. Building AI chatbots with
          TypeScript. B. Practicing methods of active learning. C. Improving
          their writing skills.{"\n"}---{"\n"}
          Suggest four (4) useful tasks an AI assistant can perform for the user
        </system>
        <Assistant tools={[suggestedTaskTool]} toolChoice={suggestedTaskTool} />
      </Thread>
      <Repeat>
        <User />
        <Thread>
          <system>
            Given the users previous message(s) suggest four (4) follow up
            questions that could help the user find the information they are
            seeking.
          </system>
          <Assistant
            tools={[followUpQuestions]}
            toolChoice={followUpQuestions}
          />
        </Thread>
        <Assistant />
      </Repeat>
    </>
  );
}
