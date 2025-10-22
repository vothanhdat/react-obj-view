import React, { type Dispatch, type SetStateAction, useMemo, useCallback, useState, useEffect, useRef, Ref } from "react";
import { ChangeFlashWrappper } from "../utils/ChangeFlashWrappper";
import { GroupedObject, toGrouped } from "../utils/GroupedObject";

type JSONViewProps = {
    value: any;
    path?: string[];
    trace?: any[];
    name?: string;
    expandLevel: number | boolean;
    currentType?: any;
    isGrouped?: boolean;
    displayName?: boolean;
    seperator?: string,
    context: JSONViewCtx
};

type JSONViewCtx = {
    expandRootRef: React.RefObject<Record<string, boolean>>;
    objectGrouped: number,
    arrayGrouped: number,
}

const useExpandState = ({ path, expandLevel, context: { expandRootRef } }: JSONViewProps, isCircular = false) => {
    const [, reload] = useState(0)
    const expandKeys = path?.join("/") ?? "";

    const defaultExpand = typeof expandLevel == "boolean"
        ? expandLevel
        : (typeof expandLevel == 'number' && expandLevel > 0);

    const isExpand = expandRootRef?.current?.[expandKeys] ?? (defaultExpand && !isCircular)

    const setExpand = useCallback(
        (value: boolean) => {
            if (expandRootRef.current) {
                expandRootRef.current[expandKeys] = value;;
                reload?.(Math.random())
            }
        },
        [expandKeys]
    );

    return { isExpand, setExpand, expandKeys };

};

const JSONViewObj: React.FC<JSONViewProps & { childDisplayName?: boolean, childSeperator?: string }> = (props) => {

    const {
        value, name,
        expandLevel,
        context,
        currentType,
        displayName = true,
        childDisplayName = true,
        seperator = ":",
        childSeperator = ":",
        trace = [],
        path = [],
    } = props;

    const isCircular = useMemo(
        () => {
            if (value && trace.length) {
                let idx = trace.indexOf(value)
                return !(idx == -1 || idx == trace.length - 1)
            } else {
                return false
            }
        },
        [trace, value]
    )

    const { isExpand, setExpand, expandKeys } = useExpandState(props, isCircular);

    const { objectGrouped, arrayGrouped } = context

    const childExpandLevel = typeof expandLevel == "number" ? expandLevel - 1 : expandLevel;

    const { isArray, size, shouldGroup, ableToExpand, groupedChilds, } = useMemo(
        () => {

            if (value instanceof GroupedObject) {
                const isArray = value.obj instanceof Array;
                const size = value.getSize();
                const groupdSize = isArray ? arrayGrouped : objectGrouped;
                const shouldGroup = size > groupdSize;
                const ableToExpand = size > 0;

                const groupedChilds = shouldGroup
                    ? Object.fromEntries(
                        toGrouped(value, groupdSize)
                            .map(g => [g.getKey(), g])
                    )
                    : value.getObject();

                return { size, isArray, shouldGroup, ableToExpand, groupedChilds, };
            } else if (value) {
                const isArray = value instanceof Array;
                const size = isArray ? value.length : Object.keys(value).length;
                const groupdSize = isArray ? arrayGrouped : objectGrouped;
                const shouldGroup = size > groupdSize;

                const ableToExpand = size > 0;

                const groupedChilds = shouldGroup
                    ? Object.fromEntries(
                        toGrouped(new GroupedObject(value), groupdSize)
                            .map(g => [g.getKey(), g])
                    )
                    : value;

                return { isArray, size, shouldGroup, ableToExpand, groupedChilds, };
            } else {
                return { isArray: false, size: 0, shouldGroup: false, ableToExpand: false, groupedChilds: [], };

            }
        },
        [value, objectGrouped, arrayGrouped]
    );



    return <ChangeFlashWrappper className={"jv-field jv-field-obj jv-field-" + currentType} value={value}>
        {isExpand && ableToExpand ? <>
            <div>
                <div onClick={() => setExpand(false)}>
                    {isCircular && <span className="jv-tag">circular</span>}
                    {displayName && <span className="jv-name">{name}</span>}
                    {displayName && <span>{seperator}</span>}
                    <span>[-]</span>
                    {currentType && <span className="jv-type">{currentType}</span>}
                    <span className="jv-meta">{size} items</span>
                    <span>{isArray ? "[" : "{"} </span>
                </div>
            </div>
            <div className="jv-value">
                {Object
                    .entries(groupedChilds)
                    .map(([name, value], index) => ({
                        name, value,
                        displayName: childDisplayName,
                        seperator: childSeperator,
                        ...value instanceof GroupedObject ? {
                            childDisplayName,
                            childSeperator,
                            trace,
                            path: [...path, String(index)],
                        } : {
                            trace: [...trace, value],
                            path: [...path, name],
                        },

                    }))
                    .map((props) => <JSONViewCurr
                        {...{
                            ...props,
                            context,
                            expandLevel: childExpandLevel,
                            isGrouped: shouldGroup,
                        }}
                        key={props.path.join("/")} />)}
            </div>
            {name && <div>
                <span> {isArray ? "]" : "}"} </span>
            </div>}
        </> : <>
            <div>
                <div onClick={() => ableToExpand && setExpand(true)}>
                    {isCircular && <span className="jv-tag">circular</span>}
                    {displayName && <span className="jv-name">{name}</span>}
                    {displayName && name && <span>{seperator}</span>}
                    {name && ableToExpand && <span>[+]</span>}
                    {currentType && <span className="jv-type">{currentType}</span>}
                    <span className="jv-meta">{size} items</span>
                    <span>{isArray ? "[" : "{"}</span>
                    {ableToExpand && <PreviewObj {...{ value, size, }} />}
                    <span>{isArray ? "]" : "}"}</span>
                </div>
            </div>
        </>}
    </ChangeFlashWrappper>;
};

const PreviewObj: React.FC<{ size: number; value: any; }> = ({ }) => {
    return <span className="jv-preview"> ... </span>;
};

const StringViewObj: React.FC<JSONViewProps> = (props) => {


    const { currentType, name, value, displayName, seperator = ":", } = props;

    const { isExpand, setExpand } = useExpandState(props);

    const useExpand = String(value).length > 50;

    const renderString = useExpand && !isExpand
        ? `${String(value).slice(0, 15)}...${String(value).slice(-15, -1)}`
        : String(value);

    return <ChangeFlashWrappper
        value={props.value}
        className={`jv-field jv-field-${currentType} ${useExpand ? 'jv-cursor' : ''}`}
        onClick={() => setExpand(!isExpand)}>
        {displayName && <span className="jv-name">{name}</span>}
        {displayName && <span>{seperator}</span>}
        <span className="jv-type">{currentType}{useExpand && <> lng={value?.length}</>}</span>
        <span className="jv-value">"{renderString}"</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

const FunctionViewObj: React.FC<JSONViewProps> = (props) => {
    const { currentType, name, value, displayName, seperator = ":", } = props;
    const { isExpand, setExpand } = useExpandState(props);
    const fnString = String(value).trim()
    const useExpand = fnString.length > 50;
    const renderString = useExpand && !isExpand
        ? `${fnString.slice(0, 15)}...${fnString.slice(-15)}`
        : fnString;
    return <ChangeFlashWrappper
        value={props.value}
        className={`jv-field jv-field-${currentType} ${useExpand ? 'jv-cursor' : ''}`}
        onClick={() => setExpand(!isExpand)}>
        {displayName && <span className="jv-name">{name}</span>}
        {displayName && <span>{seperator}</span>}
        <span className="jv-type">{currentType}</span>
        <span className="jv-value">"{renderString}"</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

const DefaultValueView: React.FC<JSONViewProps> = (props) => {

    const { currentType, name, value, displayName, seperator = ":", } = props;

    return <ChangeFlashWrappper
        value={props.value}
        className={`jv-field jv-field-${currentType}`}>
        {displayName && <span className="jv-name">{name}</span>}
        {displayName && <span>{seperator}</span>}
        <span className="jv-type">{currentType}</span>
        <span className="jv-value">{String(value)}</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

const SIMPLE_INSTANCE_RENDER = new Set([
    Date,
    RegExp,
    Number,
    String,
])


export const MapView: React.FC<JSONViewProps> = (props) => {
    const value = useMemo(
        () => props.value instanceof Map
            ? Object.fromEntries([...props.value.entries()])
            : {},
        [props.value]
    )

    return <JSONViewObj
        {...props}
        {...{ currentType: "Map", value, childSeperator: " => " }}
    />
}

export const SetView: React.FC<JSONViewProps> = (props) => {
    const value = useMemo(
        () => props.value instanceof Set
            ? [...props.value.values()]
            : [],
        [props.value]
    )

    return <JSONViewObj
        {...props}
        {...{ currentType: "Set", value, childDisplayName: false }}
    />
}

const pendingSymbol = Symbol("Pending")

export const PromiseView: React.FC<JSONViewProps> = (props) => {

    const promiseValue = useMemo(
        () => props.value instanceof Promise
            ? Promise.race([props.value, pendingSymbol])
                .then(e => e == pendingSymbol ? { status: "pending" } : { status: "resolved", result: e })
                .catch(e => ({ status: "rejected", reason: e }))
            : Promise.resolve({}),
        [props.value]
    )

    const [value, setValue] = useState<any>(undefined)

    useEffect(() => {
        promiseValue.then(e => setValue(e))
    }, [promiseValue])

    return value && <JSONViewObj
        {...props}
        {...{ currentType: "Promise", value }}
    />
}

const JSONViewCurr: React.FC<Omit<JSONViewProps, 'currentField' | 'currentType'>> = (props) => {

    const { value, path = [], name, } = props;

    const currentField = path.at(-1) ?? name ?? undefined;

    const currentType = typeof value;

    if (!value) {
        return <DefaultValueView {...props} {...{ currentField, currentType }} />;
    }

    switch (currentType) {
        case "object": {

            if (SIMPLE_INSTANCE_RENDER.has(value?.constructor)) {
                return <DefaultValueView
                    {...props}
                    {...{ currentField, currentType: value.constructor.name }}
                />;
            }

            if (value instanceof GroupedObject) {
                return <JSONViewObj {...props} {...{ currentField, currentType: undefined }} />;
            }

            if (value instanceof Map) {
                return <MapView {...props} {...{ currentField }} />;
            }

            if (value instanceof Set) {
                return <SetView {...props} {...{ currentField }} />;
            }

            if (value instanceof Promise) {
                return <PromiseView {...props} {...{ currentField }} />;
            }

            if (value instanceof Error) {
                return <DefaultValueView {...props} {...{ currentField, currentType: value?.constructor.name }} />;
            }

            if (!(value instanceof Array) && value?.constructor != Object) {
                return <JSONViewObj {...props} {...{ currentField, currentType: value?.constructor.name }} />
            }

            return <JSONViewObj {...props} {...{ currentField, currentType: "" }} />
        }
        case "string":
            return <StringViewObj {...props} {...{ currentField, currentType }} />;
        case "function":
            return <FunctionViewObj {...props} {...{ currentField, currentType }} />;
        case "number":
        case "boolean":
        case "bigint":
        case "symbol":
        case "undefined":
        default:
            return <DefaultValueView {...props} {...{ currentField, currentType }} />;
    }
};


export const ObjectView: React.FC<{
    value: any;
    name?: string; style?: any;
    expandLevel?: number | boolean;
    objectGrouped?: number,
    arrayGrouped?: number,
}> = ({ value, name, style, expandLevel = false, objectGrouped = 25, arrayGrouped = 10 }) => {

    const expandRootRef = useRef<Record<string, boolean>>({})

    const context: JSONViewCtx = useMemo(() => ({
        expandRootRef,
        objectGrouped,
        arrayGrouped,
    }), [expandRootRef, objectGrouped, arrayGrouped])

    const emptyPath = useMemo(() => [], [])
    const emptyTrace = useMemo(() => [], [])

    return <div className="jv-root" style={style}>
        <JSONViewCurr
            path={emptyPath}
            trace={emptyTrace}
            {...{ name, value, context, expandLevel }} />
    </div>;
};
