export function getEnv(name: string): string | undefined {
  return (
    (globalThis.process && process.env[name] != null && process.env[name]) ||
    undefined
  );
}
