import { useState, useCallback } from "react";
import { LazyValue } from "../../object-tree";

export const useLazyValue = ({ value, refreshPath }: { value: LazyValue; refreshPath?: () => void; }) => {

    const isLazyValue = value instanceof LazyValue;

    const [lazyValueInited, setLazyValueInited] = useState(isLazyValue && value.inited);

    const lazyValueEmit = useCallback(() => {
        if (value instanceof LazyValue) {
            // console.log("init lazy value");
            value.init();
            setLazyValueInited(value.inited);
            // console.log(value);
            refreshPath?.();
        }
    }, [isLazyValue && value, isLazyValue && refreshPath]);

    const renderValue = isLazyValue ? (value.value ?? value.error) : value;

    return {
        isLazyValue,
        renderValue,
        lazyValueInited, 
        lazyValueEmit: isLazyValue ? lazyValueEmit: undefined
    };

};
