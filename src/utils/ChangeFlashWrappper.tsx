import React, { useRef, useEffect } from "react";
import { GroupedObject } from "./GroupedObject";


export const ChangeFlashWrappper: React.FC<React.ComponentProps<'div'> & { value: any; }> = ({ value, ...rest }) => {

    const ref = useRef<HTMLElement>(undefined);
    const refValue = useRef(value);

    useEffect(() => {
        if (ref.current) {
            const p = performance.now();
            let tmp1: any, tmp2: any;
            let isDiff = value instanceof GroupedObject && refValue.current instanceof GroupedObject
                ? (
                    value.getSize() != refValue.current.getSize()
                    || (tmp1 = value.obj, tmp2 = refValue.current.obj, value.getKeys().some(k => tmp1[k] != tmp2[k]))
                ) : (
                    value != refValue.current
                );
            const p1 = performance.now();

            if (p1 - p >= 1) {
                console.warn("Slow Compare perfomance", { time: p1 - p, size: value?.getSize?.(), value });
            }

            if (isDiff) {
                refValue.current = value;
                ref.current.classList.add('jv-updated');
                let t = requestAnimationFrame(() => ref.current?.classList.remove('jv-updated'));
                return () => cancelAnimationFrame(t);
            }
        }

    }, [value, ref]);

    return <div {...rest} ref={ref as any} />;
};
