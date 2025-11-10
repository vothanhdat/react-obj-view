import React, { useRef, useEffect, useId } from "react";


export const useChangeFlashClasses = ({ value, enable = true, flashClassname = 'jv-updated' }: { value: any; flashClassname?: string; enable?: boolean }) => {
    const ref = useRef<HTMLElement>(undefined);
    const refValue = useRef(value);

    useEffect(() => {
        if (ref.current) {
            const p = performance.now();

            let isDiff = value != refValue.current
            // console.log("change", { value, refVal: refValue.current, isDiff })

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

    // const id = useId()

    // useEffect(() => {
    //     console.log("Mount", id)
    //     return () => console.log("Unmount", id)
    // },[id])

    return ref
}
