import { hidePrototype } from "../getEntries";
import { simpleCache } from "../resolver/_shared";

export const proxyInfo = Symbol("Info")

export class GroupedProxy {
    [proxyInfo]!: { from: number, to: number, origin: any, iterators?: [any, any][], }
}


const SPLIT_CHAR = " … ";

export const objectGroupProxyFactory = () => {

    let value: any
    let maxSize = 10;
    let isArray!: boolean;
    let iterators!: any[];
    let keySize: number;

    const getChildsFn = (_from: number, _to: number, _value: any): any => {

        let size = _to - _from;
        let childCount = maxSize ** Math.floor(Math.log(size - 1) / Math.log(maxSize));
        let childSize = Math.ceil((size - 1) / childCount)

        return childCount > 1
            ? new Proxy(
                new GroupedProxy(),
                {
                    ownKeys: () => Array(childSize).fill(0)
                        .map((_, i) => [
                            `${_from + i * childCount}`,
                            `${Math.min(_from + i * childCount + childCount, keySize)}`
                        ].join(SPLIT_CHAR)),
                    getOwnPropertyDescriptor(_, prop) {
                        const [from, to] = String(prop).split(SPLIT_CHAR);
                        return {
                            configurable: true,
                            enumerable: +to - 1 > +from,
                            value: (+to - 1 > +from) ? getChildsFn(+from, +to, _value) : undefined,
                        };
                    },
                    get(_, key) {
                        if (key === proxyInfo)
                            return { from: _from, to: _to, iterators, origin: _value }
                        if (key === hidePrototype)
                            return true
                        const [from, to] = String(key).split(SPLIT_CHAR);
                        if (+to - 1 > +from) return getChildsFn(+from, +to, _value);
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
                            value: isArray ? _value[Number(key)] : _value[key],
                        };
                    },
                    get(_, key) {
                        if (key === proxyInfo)
                            return { from: _from, to: _to, iterators, origin: _value }
                        if (key === hidePrototype)
                            return true
                        return isArray ? _value[Number(key)] : _value[key]
                    },
                }
            );
    }


    const getChilds: any = simpleCache(
        getChildsFn,
        (_from, _to, _value) => _from + ":" + _to
    );

    return (_value: any, _maxSize: number) => {

        if (value != _value || _maxSize != maxSize) {
            getChilds.clear()
        }

        value = _value;
        maxSize = _maxSize;
        isArray = _value instanceof Array;

        iterators = isArray ? _value : Object.entries(_value)

        if (iterators.length < _maxSize)
            return _value;

        keySize = iterators.length;

        return getChilds(0, keySize, value)
    }
}

export const groupedProxyIsEqual = (
    value: GroupedProxy,
    compare: GroupedProxy,
) => {
    if (value instanceof GroupedProxy && compare instanceof GroupedProxy) {
        if (value === compare)
            return true;
        const { from: fromPrivious, to: toPrevious, origin: previous } = compare[proxyInfo]
        const { from, to, origin: current, iterators } = value[proxyInfo]
        if (current === previous) {
            return true
        } else if (fromPrivious == from && toPrevious == to) {
            if (current instanceof Array && previous instanceof Array) {
                for (let i = from; i < to; i++) {
                    if (current[i] !== previous[i])
                        return false
                }
                return true
            } else if (current && previous && iterators) {
                for (let i = from; i < to; i++) {
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