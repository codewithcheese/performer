import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";

const examples = [
  {
    title: "Introduction",
    examples: [
      {
        slug: "messages",
        title: "Messages",
      },
      {
        slug: "elements",
        title: "Elements",
      },
    ],
  },
  {
    title: "Components",
    examples: [
      {
        slug: "assistant",
        title: "Assistant",
      },
      {
        slug: "user",
        title: "User",
      },
    ],
  },
];

export function TableOfContents({
  sections = examples,
  activeSection,
  isLoading,
}) {
  const activeElRef = useRef(null);

  useEffect(() => {
    if (activeElRef.current) {
      activeElRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeSection]);

  return (
    <>
      <ul className="examples-toc">
        {sections.map((section) => {
          return (
            <li key={section.title}>
              <span className="section-title text-sm">{section.title}</span>
              {section.examples.map((example) => (
                <div
                  key={example.slug}
                  className={classNames("row", {
                    active: example.slug === activeSection,
                    loading: isLoading,
                  })}
                >
                  <a
                    href={`/examples/${example.slug}`}
                    className={classNames("row", {
                      active: example.slug === activeSection,
                      loading: isLoading,
                    })}
                  >
                    <img
                      className="thumbnail"
                      alt={`${example.title} thumbnail`}
                      src={`/examples/thumbnails/${example.slug}.jpg`}
                    />
                    <span>{example.title}</span>
                  </a>
                  {example.slug === activeSection && (
                    <a
                      href={`/repl/${example.slug}`}
                      className="repl-link"
                      ref={activeElRef}
                    >
                      REPL
                    </a>
                  )}
                </div>
              ))}
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        .examples-toc {
          overflow-y: auto;
          height: 100%;
          //border-right: 1px solid var(--sk-back-4);
          //background-color: var(--sk-back-3);
          //color: var(--sk-text-2);
          padding: 3rem 3rem 0 3rem;
          margin: 0;
        }

        .examples-toc li {
          display: block;
          line-height: 1.2;
          margin: 0 0 4.8rem 0;
        }

        .section-title {
          display: block;
          padding: 0 0 0.8rem 0;
          //font: 400 var(--sk-text-xs) var(--sk-font);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 700;
        }

        .examples-toc div {
          display: flex;
          flex-direction: row;
          padding: 0.2rem 3rem;
          margin: 0 -3rem;
        }

        .examples-toc div.active {
          color: white;
        }

        .examples-toc div.active.loading {
          //background: rgba(0, 0, 0, 0.1) calc(100% - 3rem) 47% no-repeat url(/icons/loading.svg);
          background-size: 1em 1em;
          color: white;
        }

        .examples-toc a {
          display: flex;
          flex: 1 1 auto;
          position: relative;
          //color: var(--sk-text-2);
          border-bottom: none;
          //font-size: 1.6rem;
          align-items: center;
          justify-content: start;
          padding: 0;
        }

        .examples-toc a:hover {
          //color: var(--sk-text-1);
        }

        .examples-toc .repl-link {
          flex: 0 1 auto;
          font-size: 1.2rem;
          font-weight: 700;
          margin-right: 2.5rem;
        }

        .examples-toc .thumbnail {
          background-color: #fff;
          object-fit: contain;
          width: 5rem;
          height: 5rem;
          border-radius: 2px;
          box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.13);
          margin: 0.2em 0.5em 0.2em 0;
        }
      `}</style>
    </>
  );
}
