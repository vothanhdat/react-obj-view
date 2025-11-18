import { useState, useCallback } from "react";

type CopyState = [
    copying: boolean,
    success: boolean,
    error: any
];
export function useCopy(resetTimeout = 5000) {
    const [[copying, copySuccess, copyError], setCopyState] = useState<CopyState>([false, false, undefined]);

    const handleCopy = useCallback(
        (cb: () => Promise<any>) => setCopyState(state => {
            if (state.some(Boolean)) return state;

            new Promise(r => (window?.requestIdleCallback ?? window?.requestAnimationFrame)(r))
                .then(() => cb())
                .then(value => navigator.clipboard.writeText(value))
                .then(
                    () => setCopyState([false, true, undefined]),
                    (error) => setCopyState([false, false, error])
                )
                .then(() => setTimeout(
                    () => setCopyState([false, false, undefined]),
                    resetTimeout
                ));

            return ([true, false, undefined]);
        }),
        [resetTimeout]
    );

    const handleReset = useCallback(
        () => setCopyState([false, false, undefined]),
        []
    );

    return {
        copying, copySuccess, copyError,
        canCopy: !(copying || copySuccess || copyError),
        handleCopy, handleReset,
    };
}
