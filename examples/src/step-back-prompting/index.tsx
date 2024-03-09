import {
  Assistant,
  createContext,
  readTextContent,
  useContext,
  useContextProvider,
  User,
  useResource,
} from "@performer/core";
import { JSDOM } from "jsdom";

/**
 * todo UX notifications from custom effects
 */

export const name = "Step back prompting";
export const target = "node";

const questionContext = createContext<string>("question");
const stepBackContext = createContext<string>("stepBack");

export function App() {
  const question = useContextProvider(questionContext, null);
  const stepBack = useContextProvider(stepBackContext, null);
  return () => {
    if (question.value === null || stepBack.value === null) {
      return <Question />;
    } else {
      return <Answer question={question.value} stepBack={stepBack.value} />;
    }
  };
}

function Question() {
  const question = useContext(questionContext);
  const stepBack = useContext(stepBackContext);
  return () => (
    <>
      <system>
        You are an expert at world knowledge. Your task is to step back and
        paraphrase a question to a more generic step-back question, which is
        easier to answer.
      </system>
      <user>Could the members of The Police perform lawful arrests?</user>
      <assistant>what can the members of The Police do?</assistant>
      <user>Jan Sindel’s was born in what country?</user>
      <assistant>what is Jan Sindel’s personal history?</assistant>
      <User
        onMessage={(message) => (question.value = readTextContent(message))}
      />
      <Assistant
        onMessage={(message) => (stepBack.value = readTextContent(message))}
      />
    </>
  );
}

type AnswerProps = {
  question: string;
  stepBack: string;
};

function Answer({ question, stepBack }: AnswerProps) {
  const results = useResource(() =>
    Promise.all([searchDuckDuckGo(question), searchDuckDuckGo(stepBack)]),
  );

  const searchResults = results
    .map((result) => extractSearchResults(result))
    .flat()
    .map(({ title, link, abstract }) => {
      return `title: ${title}\nsummary: ${abstract}\nlink: ${link}`;
    })
    .join("\n");

  return () => (
    <>
      <system>
        You are an expert of world knowledge. I am going to ask you a question.
        Your response should be comprehensive and not in contradiction with the
        following search results if they are relevant. Otherwise, ignore them if
        they are not relevant. Link sources inline using markdown.
      </system>
      <system>{searchResults}</system>
      <user>{question}</user>
      <Assistant model="gpt-3.5-turbo-1106" />
    </>
  );
}

async function searchDuckDuckGo(query: string) {
  const url = new URL("https://html.duckduckgo.com/html");
  const params = {
    q: query,
    no_redirect: "1",
  };
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  return await response.text();
}

function extractSearchResults(
  html: string,
): { title: string; link: string; abstract: string; url: string }[] {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const results: {
    title: string;
    link: string;
    abstract: string;
    url: string;
  }[] = [];
  const resultElements = document.querySelectorAll(".result");

  resultElements.forEach((result) => {
    const titleElement = result.querySelector(
      ".result__title a",
    ) as HTMLAnchorElement | null;
    const snippetElement = result.querySelector(".result__snippet");
    const urlElement = result.querySelector(".result__url");

    if (titleElement && snippetElement && urlElement) {
      results.push({
        title: titleElement.textContent ? titleElement.textContent.trim() : "",
        link: titleElement.href,
        abstract: snippetElement.textContent
          ? snippetElement.textContent.trim()
          : "",
        url: urlElement.textContent ? urlElement.textContent.trim() : "",
      });
    }
  });

  return results;
}
