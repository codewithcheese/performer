import ButtonLink from "./ButtonLink";
import { Logo } from "./Logo";
import { twMerge } from "tailwind-merge";

function Section({ children, background = null }) {
  return (
    <div
      className={twMerge(
        "mx-auto flex flex-col w-full",
        background === null && "max-w-7xl",
        background === "left-card" &&
          "bg-gradient-left dark:bg-gradient-left-dark border-t border-primary/10 dark:border-primary-dark/10 ",
        background === "right-card" &&
          "bg-gradient-right dark:bg-gradient-right-dark border-t border-primary/5 dark:border-primary-dark/5",
      )}
      style={{
        contain: "content",
      }}
    >
      <div className="flex-col gap-2 flex grow w-full my-20 lg:my-32 mx-auto items-center">
        {children}
      </div>
    </div>
  );
}

function Header({ children }) {
  return (
    <h2 className="leading-xl font-display text-primary dark:text-primary-dark font-semibold text-4xl lg:text-5xl -mt-4 mb-7 w-full max-w-3xl lg:max-w-xl">
      {children}
    </h2>
  );
}

function Para({ children }) {
  return (
    <p className="max-w-3xl mx-auto text-lg lg:text-xl text-secondary dark:text-secondary-dark leading-normal">
      {children}
    </p>
  );
}

function Center({ children }) {
  return (
    <div className="px-5 lg:px-0 max-w-4xl lg:text-center text-white text-opacity-80 flex flex-col items-center justify-center">
      {children}
    </div>
  );
}

function FullBleed({ children }) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col w-full">{children}</div>
  );
}

function Code({ children }) {
  return (
    <code
      dir="ltr"
      className="font-mono inline rounded-lg bg-gray-15/40 dark:bg-secondary-button-dark py-0.5 px-1 text-left"
    >
      {children}
    </code>
  );
}

export function HomeContent() {
  return (
    <>
      <div className="ps-0">
        <div className="mx-5 mt-12 lg:mt-24 mb-20 lg:mb-32 flex flex-col justify-center">
          <Logo
            className={twMerge(
              "mt-4 mb-3 text-link dark:text-link-dark w-28 lg:w-32 self-center text-sm me-0 flex origin-center",
            )}
          />
          <h1 className="text-4xl font-display lg:text-6xl self-center flex font-semibold leading-snug text-primary dark:text-primary-dark">
            Performer
          </h1>
          <p className="text-3xl font-display max-w-lg md:max-w-full py-1 text-center text-secondary dark:text-primary-dark leading-snug self-center">
            Component framework for building AIs
          </p>
          <div className="mt-5 self-center flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
            <ButtonLink
              href={"/learn"}
              type="primary"
              size="lg"
              className="w-full sm:w-auto justify-center"
              label="Learn Performer"
            >
              Learn Performer
            </ButtonLink>
            <ButtonLink
              href={"/reference/react"}
              type="secondary"
              size="lg"
              className="w-full sm:w-auto justify-center"
              label="API Reference"
            >
              API Reference
            </ButtonLink>
          </div>
        </div>
      </div>

      <Section background="left-card">
        <Center>
          <Header>Create AIs from components</Header>
          <Para>
            Performer lets you build chatbots and agents out of components.
          </Para>
        </Center>
        <FullBleed>Insert example</FullBleed>
      </Section>
    </>
  );
}

// create your own building blocks
// go beyond system prompts
// end to end chat system?
// work with message declartively
