import { LazyValue } from "../custom-class/LazyValueWrapper";
import { ResolverFn } from "../types";

export const lazyValueResolver: ResolverFn<LazyValue> = (
    lazyValue: LazyValue,
    cb,
    next,
    isPreview
) => {
    if (lazyValue.inited) {
        if (lazyValue?.error) {
            next(lazyValue?.error);
        } else {
            next(lazyValue?.value);
        }
    } else {
        next(lazyValue);
    }
};
