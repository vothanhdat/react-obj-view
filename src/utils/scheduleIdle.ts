type IdleCallback = () => void;

const inBrowser = typeof window !== "undefined";

export const scheduleIdle: (cb: IdleCallback) => void = inBrowser
    ? (cb) => {
        const w = window as any;
        (w.requestIdleCallback ?? w.requestAnimationFrame ?? ((c: IdleCallback) => setTimeout(c, 0)))(cb);
    }
    : (cb) => {
        const setImm: ((cb: IdleCallback) => unknown) | undefined =
            typeof (globalThis as any).setImmediate === "function"
                ? (globalThis as any).setImmediate
                : undefined;
        if (setImm) setImm(cb);
        else setTimeout(cb, 0);
    };
