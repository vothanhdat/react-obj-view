import { WalkingAdaper, WalkingContext, walkingFactory } from "../tree-core";
import { isRef } from "../utils/isRef";
import { getEntriesCb } from "../V5/getEntries";
import { ResolverFn } from "../V5/types";
import { LazyValue } from "../V5/LazyValueWrapper";
import { CircularChecking } from "../V5/CircularChecking";


export type ObjectWalkingMeta = number

export type ObjectWalkingConfig = {
    nonEnumerable: boolean;
    symbol?: boolean;
    resolver: Map<any, ResolverFn> | undefined;
}

export type ObjectWalkingContext = WalkingContext<ObjectWalkingConfig> & {
    circularChecking: CircularChecking
}

type ObjectWalkingAdater = WalkingAdaper<
    unknown,
    PropertyKey,
    ObjectWalkingMeta,
    ObjectWalkingConfig,
    ObjectWalkingContext
>


const objectWalkingAdaper: ObjectWalkingAdater = {
    defaultMeta() { return 0b11 },
    defaultContext(ctx) {
        return {
            ...ctx,
            circularChecking: new CircularChecking()
        }
    },
    valueHasChild(value) {
        return isRef(value)
            && !(value instanceof Date)
            && !(value instanceof RegExp)
            && !(value instanceof LazyValue)
    },
    iterateChilds(value, { config, circularChecking }, ref, cb) {
        circularChecking.enterNode(value);
        getEntriesCb(
            value,
            config as any,
            false,
            ref,
            (key, value, enumerable) => cb(
                value, key,
                (enumerable ? 1 : 0)
                | (circularChecking.checkCircular(value) ? 0 : 2),
            )
        )
        circularChecking.exitNode(value);
    },
    valueDefaultExpaned(value, key, meta, config) {
        return meta == 0b11
    },
}

export const objectTreeWalking = () => walkingFactory(objectWalkingAdaper)

