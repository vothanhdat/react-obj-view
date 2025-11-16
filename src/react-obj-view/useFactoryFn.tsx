import { RefObject, useRef } from "react";

export function useFactoryFn<T extends () => any>(factory: T): RefObject<ReturnType<T> | undefined> {
    const factoryRef = useRef<T>(undefined);
    const instanceRef = useRef<ReturnType<T>>(undefined);

    if (!instanceRef.current || factoryRef.current != factory) {
        factoryRef.current = factory;
        instanceRef.current = factory();
    };

    return instanceRef
}
