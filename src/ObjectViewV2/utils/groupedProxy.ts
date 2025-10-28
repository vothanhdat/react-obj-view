export class GroupedProxy { }

export const getObjectGroupProxyEntries = (iterators: { name: string, data: any }[], maxSize: number = 10) => {

    const indexed = new Map(iterators.map(e => [e.name, e.data]))

    const keySize = iterators.length;

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
                        return { configurable: true, enumerable: +to - 1 > +from, };
                    },
                    get(_, key) {
                        const [from, to] = String(key).split(splitChars);
                        if (+to - 1 > +from) return getChilds(+from, +to);
                        return undefined
                    },
                }
            ) : new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(size).fill(0)
                        .map((_, i) => from + i)
                        .map(index => String(iterators[index].name)),

                    getOwnPropertyDescriptor(_, key) {
                        return {
                            configurable: true,
                            enumerable: true,
                        };
                    },
                    get(_, key) {
                        return indexed.get(key as any);
                    },
                }
            );
    };

    return getChilds(0, iterators.length);
};
