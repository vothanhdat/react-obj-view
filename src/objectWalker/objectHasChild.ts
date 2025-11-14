import { isRef } from "./utils/isRef";
import { LazyValue } from "./LazyValueWrapper";

export const objectHasChild = (value: unknown) => {
    return (
        isRef(value) &&
        !(value instanceof Date) &&
        !(value instanceof RegExp) &&
        !(value instanceof LazyValue)
    );
};
