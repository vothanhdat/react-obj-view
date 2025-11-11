import { hidePrototype } from "../V5/getEntries";
import { simpleCache, weakMapCacheMultipleLevel } from "../V5/resolvers/_shared";

export const proxyInfo = Symbol("Info")

export class GroupedProxy {
    [proxyInfo]!: { from: number, to: number, origin: any, iterators?: [any, any][], }
}


const SPLIT_CHAR = " … ";

export const getObjectGroupProxyEntries = weakMapCacheMultipleLevel(
    (
        value: any,
        maxSize: number = 10
    ) => {

        const isArray = value instanceof Array;

        const iterators = isArray ? value : Object.entries(value)

        const keySize = iterators.length;

        if (keySize < maxSize) return value;

        const getChilds: any = simpleCache((_from: number = 0, _to: number = iterators.length) => {

            let size = _to - _from;
            let seperator = maxSize ** Math.floor(Math.log(size - 1) / Math.log(maxSize));
            let childSize = Math.ceil((size - 1) / seperator)

            return seperator > 1
                ? new Proxy(
                    new GroupedProxy(),
                    {
                        ownKeys: () => Array(childSize).fill(0)
                            .map((_, i) => [
                                `${_from + i * seperator}`,
                                `${Math.min(_from + i * seperator + seperator, keySize)}`
                            ].join(SPLIT_CHAR)),
                        getOwnPropertyDescriptor(_, prop) {
                            const [from, to] = String(prop).split(SPLIT_CHAR);
                            return {
                                configurable: true,
                                enumerable: +to - 1 > +from,
                                value: (+to - 1 > +from) ? getChilds(+from, +to) : undefined,
                            };
                        },
                        get(_, key) {
                            if (key === proxyInfo)
                                return { from: _from, to: _to, iterators, origin: value }
                            if (key === hidePrototype)
                                return true
                            const [from, to] = String(key).split(SPLIT_CHAR);
                            if (+to - 1 > +from) return getChilds(+from, +to);
                            return undefined;
                        },
                    }
                ) : new Proxy(
                    new GroupedProxy(),
                    {
                        ownKeys: isArray
                            ? () => Array(size).fill(0)
                                .map((_, i) => String(_from + i))
                            : () => Array(size).fill(0)
                                .map((_, i) => _from + i)
                                .map(index => String(iterators[index][0])),

                        getOwnPropertyDescriptor(_, key) {
                            return {
                                configurable: true, enumerable: true,
                                value: isArray ? value[Number(key)] : value[key],
                            };
                        },
                        get(_, key) {
                            if (key === proxyInfo)
                                return { from: _from, to: _to, iterators, origin: value }
                            if (key === hidePrototype)
                                return true
                            return isArray ? value[Number(key)] : value[key]
                        },
                    }
                );
        });

        return getChilds();
    }
);

export const groupedProxyIsEqual = (
    value: GroupedProxy,
    compare: GroupedProxy,
) => {
    if (value instanceof GroupedProxy && compare instanceof GroupedProxy) {
        if (value == compare)
            return true;
        const { from: fromPrivious, to: toPrevious, origin: previous } = compare[proxyInfo]
        const { from, to, origin: current, iterators } = value[proxyInfo]
        if (current === previous) {
            return true
        } else if (fromPrivious == from && toPrevious == to) {
            if (current instanceof Array && previous instanceof Array) {
                for (let i = from; i <= to; i++) {
                    if (current[i] !== previous[i])
                        return false
                }
                return true
            } else if (current && previous && iterators) {
                for (let i = from; i <= to; i++) {
                    let key = iterators[i][0]
                    if (current[key] !== previous[key])
                        return false
                }
                return true
            }

        }
        return false
    } else {
        return value == compare
    }

}