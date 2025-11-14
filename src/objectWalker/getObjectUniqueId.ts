import { isRef } from "./utils/isRef";

export const getObjectUniqueId = (() => {
    let counter = 0;
    let weakMap = new WeakMap();
    return (e: any) => {
        if (isRef(e)) {
            if (!weakMap.has(e)) {
                weakMap.set(e, counter++);
            }
            return weakMap.get(e);
        } else {
            return 0;
        }
    };
})();
