import { LazyValue } from "../custom-class/LazyValueWrapper";
import { ResolverFn } from "../types";

export const lazyValueResolver: ResolverFn<LazyValue> = function* (
    lazyValue: LazyValue,
    next,
    isPreview
) {
    if (lazyValue.inited) {
        if (lazyValue?.error) {
            yield* next(lazyValue?.error);
        } else {
            yield* next(lazyValue?.value);
        }
    } else {
        yield* next(lazyValue);
    }
};
