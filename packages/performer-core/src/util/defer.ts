export class DeferResource extends Error {
  cause: { promise: Promise<any> };

  constructor(promise: Promise<any>) {
    super("Deferred");
    this.cause = { promise };
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DeferResource);
    }
  }
}

export class DeferInput extends Error {
  cause: {};

  constructor() {
    super("Deferred");
    this.cause = {};
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DeferInput);
    }
  }
}
