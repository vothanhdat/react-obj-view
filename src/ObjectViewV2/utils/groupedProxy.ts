export class GroupedProxy { }

export const infoSymbol = Symbol("Info")

export const getObjectGroupProxyEntries = (
    indexed: any,
    maxSize: number = 10
) => {
    const iterators = Object.entries(indexed)

    const keySize = iterators.length;

    if (keySize < maxSize)
        return indexed;

    const splitChars = " … ";

    const getChilds: any = (_from: number, _to: number) => {

        let size = _to - _from;
        let seperator = maxSize ** Math.floor(Math.log(size - 1) / Math.log(maxSize));
        let childSize = Math.ceil((size - 1) / seperator)

        return seperator > 1
            ? new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(childSize)
                        .fill(0)
                        .map((_, i) => [
                            `${_from + i * seperator}`,
                            `${Math.min(_from + i * seperator + seperator, keySize)}`
                        ].join(splitChars)),
                    getOwnPropertyDescriptor(_, prop) {
                        const [from, to] = String(prop).split(splitChars);
                        return {
                            configurable: true,
                            enumerable: +to - 1 > +from,
                            value: (+to - 1 > +from) ? getChilds(+from, +to) : undefined,
                        };
                    },
                    get(_, key) {
                        if (key == infoSymbol)
                            return { from: _from, to: _to }
                        const [from, to] = String(key).split(splitChars);
                        if (+to - 1 > +from) return getChilds(+from, +to);
                        return indexed[key];
                    },
                }
            ) : new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(size).fill(0)
                        .map((_, i) => _from + i)
                        .map(index => String(iterators[index][0])),

                    getOwnPropertyDescriptor(_, key) {
                        return {
                            configurable: true,
                            enumerable: true,
                            value: indexed[key],
                        };
                    },
                    get(_, key) {
                        if (key == infoSymbol)
                            return { from: _from, to: _to }
                        return indexed[key]
                    },
                }
            );
    };

    return getChilds(0, iterators.length);
};



export const getArrayGroupProxyEntries = (
    indexed: any[],
    maxSize: number = 10
) => {

    const keySize = indexed.length;

    if (keySize < maxSize)
        return indexed;

    const splitChars = " … ";

    const getChilds: any = (_from: number, _to: number) => {

        let size = _to - _from;
        let seperator = maxSize ** Math.floor(Math.log(size - 1) / Math.log(maxSize));
        let childSize = Math.ceil((size - 1) / seperator)

        return seperator > 1
            ? new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(childSize)
                        .fill(0)
                        .map((_, i) => [
                            `${_from + i * seperator}`,
                            `${Math.min(_from + i * seperator + seperator, keySize)}`
                        ].join(splitChars)),
                    getOwnPropertyDescriptor(_, prop) {
                        const [from, to] = String(prop).split(splitChars);
                        return {
                            configurable: true,
                            enumerable: +to - 1 > +from,
                            value: (+to - 1 > +from) ? getChilds(+from, +to) : undefined,
                        };
                    },
                    get(_, key) {
                        if (key == infoSymbol)
                            return { from: _from, to: _to }
                        const [from, to] = String(key).split(splitChars);
                        if (+to - 1 > +from) return getChilds(+from, +to);
                        return indexed[Number(key)]
                    },
                }
            ) : new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(size).fill(0)
                        .map((_, i) => _from + i)
                        .map(index => String(index)),

                    getOwnPropertyDescriptor(_, key) {
                        return {
                            configurable: true,
                            enumerable: true,
                            value: indexed[Number(key)],
                        };
                    },
                    get(_, key) {
                        if (key == infoSymbol)
                            return { from: _from, to: _to }
                        return indexed[Number(key)]
                    },
                }
            );
    };

    return getChilds(0, indexed.length);
};
