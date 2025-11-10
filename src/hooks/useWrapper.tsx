import { useCallback } from "react";

export const useWrapper = <T,>(value: T): () => T => {
    return useCallback(
        () => value,
        [value]
    );
};
