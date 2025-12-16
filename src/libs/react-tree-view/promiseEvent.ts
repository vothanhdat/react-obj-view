export const promiseEvent = <T,>() => {

    let current = Promise.withResolvers<T>();

    return {
        wait(): Promise<T> {
            return current.promise;
        },
        emit(e: T) {
            current.resolve(e);
            current = Promise.withResolvers<T>();
        }
    };
};

export type PromiseEvent<T> = ReturnType<typeof promiseEvent<T>>;
