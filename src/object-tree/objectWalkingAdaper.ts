import { walkingFactory } from "../tree-core";
import { LazyValue } from "./custom-class/LazyValueWrapper";
import { getEntriesCb } from "./getEntries";
import { ObjectWalkingAdater, WalkingMeta } from "./types";
import { CircularChecking } from "./utils/CircularChecking";
import { getObjectUniqueId } from "./utils/getObjectUniqueId";
import { isRef } from "./utils/isRef";

export const parseWalkingMeta = (e: WalkingMeta) => {
    return {
        enumerable: !!(e & 0b01),
        isCircular: !(e & 0b10),
    };
};


export const objectWalkingAdaper: ObjectWalkingAdater = {
    transformValue(value) {
        return value instanceof LazyValue && value.inited
            ? value.value ?? value.error
            : value;
    },
    defaultMeta() { return 0b11; },
    defaultContext(ctx) {
        return {
            ...ctx,
            circularChecking: new CircularChecking()
        };
    },
    valueHasChild(value, key, meta) {
        return isRef(value)
            && (meta & 0b10) === 0b10
            && !(value instanceof Date)
            && !(value instanceof RegExp)
            && !(value instanceof LazyValue);
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
                | (circularChecking.checkCircular(value) ? 0 : 2)
            )
        );
        circularChecking.exitNode(value);
    },
    valueDefaultExpaned(meta, context) {
        return meta == 0b11;
    },
    getConfigTokenId(config) {
        return getObjectUniqueId(config);
    },
};
export const objectTreeWalkingFactory = () => walkingFactory(objectWalkingAdaper);


