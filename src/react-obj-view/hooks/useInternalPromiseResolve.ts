import { use } from "react";
import { InternalPromise } from "../../object-tree";

export const useInternalPromise = <T,>(value: T) => {
    if (value instanceof InternalPromise) {
        return use(value.promise)
    } else {
        return value
    }
}