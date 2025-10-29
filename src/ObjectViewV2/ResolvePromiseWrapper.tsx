import React, { useEffect, useState } from "react";

export class PromiseWrapper<T> {
    constructor(
        public promise: Promise<T>
    ) { }
}


export const ResolvePromise: React.FC<{ value: any; Component: React.FC<any>; }> = ({ Component, ...props }) => {
    const value = usePromiseValue(props.value);
    return <Component {...props} value={value} />;
};

export const usePromiseValue = (_value: any) => {
    const [promise, setPromise] = useState({ status: undefined as any, result: undefined as any, error: undefined as any });
    const [error, setError] = useState(undefined);
    const isPromise = (_value instanceof PromiseWrapper);

    useEffect(() => {
        if (isPromise) {
            setPromise({ status: "pending", result: undefined, error: undefined });
            _value.promise
                .then((result: any) => setPromise({ status: "resolved", result, error: undefined }))
                .catch((error: any) => setPromise({ status: "resolved", result: undefined, error }));
        } else {
            setPromise({ status: undefined, result: undefined, error: undefined });
        }

    }, [isPromise && _value]);

    return isPromise
        ? promise?.result
        : _value;

};

