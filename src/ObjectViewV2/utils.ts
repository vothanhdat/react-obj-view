export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

export function getPropertyValue(object: any, propertyName: PropertyKey) {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(object, propertyName);
    if (propertyDescriptor?.get) {
        try {
            return propertyDescriptor.get();
        } catch {
            return propertyDescriptor.get;
        }
    }

    return object[propertyName];
}


export const createIterator = (showNonenumerable: any, sortObjectKeys: any) => {
    const objectIterator = function* (data: any) {
        const shouldIterate = (typeof data === 'object' && data !== null) || typeof data === 'function';
        if (!shouldIterate) return;

        const dataIsArray = Array.isArray(data);

        // iterable objects (except arrays)
        if (!dataIsArray && data[Symbol.iterator]) {
            let i = 0;
            for (const entry of data) {
                if (Array.isArray(entry) && entry.length === 2) {
                    const [k, v] = entry;
                    yield {
                        name: k,
                        data: v,
                        isNonenumerable: false,

                    };
                } else {
                    yield {
                        name: i.toString(),
                        data: entry,
                        isNonenumerable: false,

                    };
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
                    yield {
                        name: propertyName || `""`,
                        data: propertyValue,
                        isNonenumerable: false,
                    };
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
                        yield {
                            name: propertyName,
                            data: propertyValue,
                            isNonenumerable: true,
                        };
                    }
                }
            }

            // [[Prototype]] of the object: `Object.getPrototypeOf(data)`
            // the property name is shown as "__proto__"
            if (showNonenumerable && data !== Object.prototype /* already added */) {
                // if (showNonenumerable && data !== Object.prototype /* already added */) {
                yield {
                    name: '__proto__',
                    data: Object.getPrototypeOf(data),
                    isNonenumerable: true,
                };
            }
        }
    };

    return objectIterator;
};