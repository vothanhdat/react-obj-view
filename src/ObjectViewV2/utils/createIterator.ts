import { Entry } from "../types";

export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

export function getPropertyValue(object: any, propertyName: PropertyKey) {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(object, propertyName);
    if (propertyDescriptor?.get) {
        try {
            return propertyDescriptor.get.call(object);
        } catch {

        }
    }

    try {
        return object[propertyName];
    } catch {

    }
    return undefined
}

export const createIterator = (showNonenumerable: any, sortObjectKeys: any): (data: any) => Entry[] => {

    const objectIterator = (data: any): Entry[] => {
        const shouldIterate = (typeof data === 'object' && data !== null) || typeof data === 'function';
        if (!shouldIterate) return [];

        const dataIsArray = Array.isArray(data);
        const entries: Entry[] = [];

        // iterable objects (except arrays)
        if (!dataIsArray && data[Symbol.iterator]) {
            let i = 0;
            for (const entry of data) {
                if (Array.isArray(entry) && entry.length === 2) {
                    const [k, v] = entry;
                    entries.push({
                        key: k,
                        value: v,
                        enumerable: true,

                    });
                } else {
                    entries.push({
                        key: i.toString(),
                        value: entry,
                        enumerable: true,

                    });
                }
                i++;
            }
        } else {
            const keys = Object.getOwnPropertyNames(data);
            if (sortObjectKeys === true && !dataIsArray) {
                // Array keys should not be sorted in alphabetical order
                keys.sort();
            } else if (typeof sortObjectKeys === 'function') {
                keys.sort(sortObjectKeys);
            }

            for (const propertyName of keys) {
                if (propertyIsEnumerable.call(data, propertyName)) {
                    const propertyValue = getPropertyValue(data, propertyName);
                    entries.push({
                        key: propertyName || `""`,
                        value: propertyValue,
                        enumerable: true,
                    });
                } else if (showNonenumerable) {
                    // To work around the error (happens some time when propertyName === 'caller' || propertyName === 'arguments')
                    // 'caller' and 'arguments' are restricted function properties and cannot be accessed in this context
                    // http://stackoverflow.com/questions/31921189/caller-and-arguments-are-restricted-function-properties-and-cannot-be-access
                    let propertyValue;
                    try {
                        propertyValue = getPropertyValue(data, propertyName);
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        // console.warn(e)
                    }

                    if (propertyValue !== undefined) {
                        entries.push({
                            key: propertyName,
                            value: propertyValue,
                            enumerable: false,
                        });
                    }
                }
            }

            // [[Prototype]] of the object: `Object.getPrototypeOf(data)`
            // the property name is shown as "__proto__"
            if (showNonenumerable && data !== Object.prototype /* already added */) {
                // if (showNonenumerable && data !== Object.prototype /* already added */) {
                entries.push({
                    key: '__proto__',
                    value: Object.getPrototypeOf(data),
                    enumerable: false,
                });
            }
        }

        return entries;
    };

    return objectIterator;
};

