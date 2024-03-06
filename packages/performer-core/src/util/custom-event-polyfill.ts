/**
 * CustomEvent polyfill for node <19
 */
class CustomEvent extends Event {
  #detail;

  constructor(type: string, options: any) {
    super(type, options);
    this.#detail = options?.detail ?? null;
  }

  get detail() {
    return this.#detail;
  }
}

if (typeof globalThis.CustomEvent !== "function") {
  // @ts-ignore
  globalThis.CustomEvent = CustomEvent;
}
