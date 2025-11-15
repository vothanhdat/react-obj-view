import { LazyValue } from "./custom-class/LazyValueWrapper";
import { isRef } from "./utils/isRef";


export const objectHasChild = (e: unknown) => {
    return isRef(e)
        && !(e instanceof Date)
        && !(e instanceof RegExp)
        && !(e instanceof LazyValue);
};
