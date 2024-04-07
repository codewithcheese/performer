import { afterAll, beforeAll, vi } from "vitest";
import { config } from "dotenv";

vi.stubGlobal("crypto", crypto);
vi.stubGlobal("requestIdleCallback", (callback: any) =>
  setTimeout(callback, 50),
);
config();

// fixme: find method to trigger callbacks from Generative that do not cause these warnings
// silence act warning
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
