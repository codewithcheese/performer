import ButtonLink from "./ButtonLink";
import { Logo } from "./Logo";
import { twMerge } from "tailwind-merge";

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
            Reactive component framework for AI backends.
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
    </>
  );
}

// create your own building blocks
// go beyond system prompts
// end to end chat system?
// work with message declartively
