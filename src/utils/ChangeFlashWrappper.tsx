import React, { useRef, useEffect } from "react";


export const ChangeFlashWrappper: React.FC<React.ComponentProps<'div'> & { value: any; flashClassname?: string; enable?: boolean }> = ({ value, enable = true, flashClassname = 'jv-updated', ...rest }) => {

    const ref = useRef<HTMLElement>(undefined);
    const refValue = useRef(value);

    useEffect(() => {
        if (ref.current) {
            const p = performance.now();
            let tmp1: any, tmp2: any;
            let isDiff = value != refValue.current
            
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

    return <div {...rest} ref={ref as any} />;
};
