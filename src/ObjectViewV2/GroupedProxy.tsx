export class GroupedProxy { }

export const getObjectGroupProxy = (value: any, keys: string[], maxSize: number = 10) => {

    const keySize = keys.length;

    const splitChars = " … ";

    const getChilds = (from: number, to: number) => {

        let size = to - from;
        let seperator = maxSize ** Math.floor(Math.log(size - 1) / Math.log(maxSize));
        let childSize = Math.ceil((size - 1) / seperator)

        return seperator > 1
            ? new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(childSize)
                        .fill(0)
                        .map((_, i) => [
                            `${from + i * seperator}`,
                            `${Math.min(from + i * seperator + seperator, keySize)}`
                        ].join(splitChars)),
                    getOwnPropertyDescriptor(_, prop) {
                        const [from, to] = String(prop).split(splitChars);
                        return {
                            enumerable: +to - 1 > +from,
                            configurable: true,
                        };
                    },
                    get(_, key) {
                        const [from, to] = String(key).split(splitChars);
                        if (+to - 1 > +from) return getChilds(+from, +to);
                        return Reflect.get(value, key);
                    },
                }
            ) : new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(Math.ceil((size - 1))).fill(0)
                        .map((_, i) => from + i)
                        .map(index => keys[index]),
                    getOwnPropertyDescriptor(_, key) {
                        return {
                            configurable: true,
                            enumerable: Number(key) >= from && Number(key) <= to,
                        };
                    },
                    get(_, key) {
                        return Reflect.get(value, key);
                    },
                }
            );
    };

    return getChilds(0, keys.length);
};
