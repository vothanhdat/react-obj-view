import { use } from "react";
import { InternalPromise } from "../../object-tree/resolver/promise";

export const useInternalPromiseResolve = <T,>(value: T) => {
    if (value instanceof InternalPromise) {
        return use(value.promise)
    } else {
        return value
    }
}