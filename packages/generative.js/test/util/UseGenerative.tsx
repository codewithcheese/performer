import { Generative, GenerativeContext } from "../../src/index.js";
import { useContext } from "react";
import { afterEach } from "vitest";

let generative: Generative | undefined;

export function UseGenerative() {
  const context = useContext(GenerativeContext);
  generative = context.generative;
  return null;
}

export function getGenerative() {
  return generative;
}

afterEach(() => {
  generative = undefined;
});
