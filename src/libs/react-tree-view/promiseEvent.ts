import { promiseWithResolvers } from "../../utils/promiseWithResolvers";

export const promiseEvent = <T,>() => {

    let current = promiseWithResolvers<T>();

    return {
        wait(): Promise<T> {
            return current.promise;
        },
        emit(e: T) {
            current.resolve(e);
            current = promiseWithResolvers<T>();
        }
    };
};

export type PromiseEvent<T> = ReturnType<typeof promiseEvent<T>>;
