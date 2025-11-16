import { useRef, useEffect } from "react";
import { GroupedProxy, groupedProxyIsEqual } from "../../object-tree";


export const useChangeFlashClasses = ({ value, enable = true, flashClassname = 'jv-updated' }: { value: any; flashClassname?: string; enable?: boolean }) => {
    const ref = useRef<HTMLElement>(undefined);
    const refValue = useRef(value);

    useEffect(() => {
        if (ref.current) {
            const p = performance.now();

            let isDiff = value !== refValue.current

            if (value instanceof GroupedProxy && refValue.current instanceof GroupedProxy) {
                // console.time("compare")
                isDiff = !groupedProxyIsEqual(value, refValue.current)
                // console.timeEnd("compare")
            }

            const p1 = performance.now();

            if (p1 - p >= 1) {
                console.warn("Slow Compare perfomance", { time: p1 - p, size: value?.getSize?.(), value });
            }

            if (isDiff) {
                refValue.current = value;
                ref.current.classList.add(flashClassname);
                let t = requestAnimationFrame(() => ref.current?.classList.remove(flashClassname));
                return () => cancelAnimationFrame(t);
            }
        }

    }, [enable && value, ref]);

    return ref
}
