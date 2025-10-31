

export const isDev = ((globalThis as any)?.process?.env?.NODE_ENV ?? "development") !== "production";
