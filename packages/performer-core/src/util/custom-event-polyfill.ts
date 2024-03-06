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

if (typeof global.CustomEvent !== "function") {
  // @ts-ignore
  global.CustomEvent = CustomEvent;
}
