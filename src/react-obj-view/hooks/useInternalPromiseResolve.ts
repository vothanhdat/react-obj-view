import { use } from "react";
import { InternalPromise } from "../../object-tree";

export const useInternalPromiseResolve = <T,>(value: T) => {
    if (value instanceof InternalPromise) {
        return use(value.promise)
    } else {
        return value
    }
}