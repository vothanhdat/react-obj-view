import { InferNodeResult, InferWalkingResult, WalkingAdaper, WalkingContext, walkingFactory } from "../tree-core";
import { isRef } from "../utils/isRef";
import { getEntriesCb } from "../V5/getEntries";
import { ResolverFn } from "../V5/types";
import { LazyValue } from "../V5/LazyValueWrapper";
import { CircularChecking } from "../V5/CircularChecking";


export type WalkingMeta = number

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
    WalkingMeta,
    ObjectWalkingConfig,
    ObjectWalkingContext
>

export type ObjectWalkingResult = InferWalkingResult<ObjectWalkingAdater>

export type ObjectWalkingNode = InferNodeResult<ObjectWalkingAdater>

const objectWalkingAdaper: ObjectWalkingAdater = {
    transformValue(value) {
        return value instanceof LazyValue && value.inited
            ? value.value ?? value.error
            : value;
    },
    defaultMeta() { return 0b11 },
    defaultContext(ctx) {
        return {
            ...ctx,
            circularChecking: new CircularChecking()
        }
    },
    valueHasChild(value, key, meta) {
        return isRef(value)
            && (meta & 0b10) === 0b10
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
    valueDefaultExpaned(meta, context) {
        return meta == 0b11
    },
}

export const parseWalkingMeta = (e: WalkingMeta) => {
    return {
        enumerable: !!(e & 0b01),
        isCircular: !(e & 0b10),
    }
}

export const objectTreeWalking = () => walkingFactory(objectWalkingAdaper)

