import React, { useMemo, useState, useEffect } from "react";
import { ObjectDetailView } from "../ObjectDetailView";
import { JSONViewProps } from "../JSONViewProps";

const pendingSymbol = Symbol("Pending");

export const PromiseView: React.FC<JSONViewProps> = (props) => {

    const promiseValue = useMemo(
        () => props.value instanceof Promise
            ? Promise.race([props.value, pendingSymbol])
                .then(e => e == pendingSymbol ? { status: "pending" } : { status: "resolved", result: e })
                .catch(e => ({ status: "rejected", reason: e }))
            : Promise.resolve({}),
        [props.value]
    );

    const [value, setValue] = useState<any>(undefined);

    useEffect(() => {
        promiseValue.then(e => setValue(e));
    }, [promiseValue]);

    return value && <ObjectDetailView
        {...props}
        {...{ currentType: "Promise", value }} />;
};
