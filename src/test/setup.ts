import '@testing-library/jest-dom'

// Polyfill Promise.withResolvers for test environments below v22.0 (CI runs Node 20 even though runtime engines target >=22)
if (typeof Promise.withResolvers !== "function") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Promise as any).withResolvers = <T,>() => {
    const deferred: {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: any) => void;
    } = {} as any;

    deferred.promise = new Promise<T>((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    });

    return deferred;
  };
}
