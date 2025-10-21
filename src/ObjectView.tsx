import React, { type Dispatch, type SetStateAction, useMemo, useCallback, useState } from "react";
import { ChangeFlashWrappper } from "./utils/ChangeFlashWrappper";
import { GroupedObject, toGrouped } from "./utils/GroupedObject";

type JSONViewProps = {
    value: any;
    path?: string[];
    name?: string;
    expandLevel: number | boolean;
    currentType?: any;
    isGrouped?: boolean;
    displayName?: boolean;
    context: JSONViewCtx
};

type JSONViewCtx = {
    expandRoot: Record<string, boolean>;
    setExpandRoot: Dispatch<SetStateAction<Record<string, boolean>>>;
    objectGrouped: number,
    arrayGrouped: number,
}

const useExpandState = ({ path, expandLevel, context: { expandRoot, setExpandRoot } }: JSONViewProps) => {
    const expandKeys = path?.join("/") ?? "";

    const defaultExpand = typeof expandLevel == "boolean"
        ? expandLevel
        : (typeof expandLevel == 'number' && expandLevel > 0);

    const isExpand = expandRoot?.[expandKeys] ?? defaultExpand

    const setExpand = useCallback(
        (value: boolean) => setExpandRoot((r: object) => ({ ...r, [expandKeys]: value })),
        [expandRoot, expandKeys]
    );

    return { isExpand, setExpand, expandKeys };

};

const JSONViewObj: React.FC<JSONViewProps> = (props) => {

    const {
        value, path = [], name,
        expandLevel,
        context,
        currentType,
        displayName = true
    } = props;

    const { isExpand, setExpand, expandKeys } = useExpandState(props);

    const { objectGrouped, arrayGrouped } = context

    const childExpandLevel = typeof expandLevel == "number" ? expandLevel - 1 : expandLevel;

    const { isArray, size, shouldGroup, ableToExpand, groupedChilds } = useMemo(
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


    return <ChangeFlashWrappper className="jv-field jv-field-obj" value={value}>
        {isExpand && ableToExpand ? <>
            {name && <div>
                <div onClick={() => setExpand(false)}>
                    {displayName && <span className="jv-name">{name}</span>}
                    {displayName && <span>:</span>}
                    <span>[-]</span>
                    {currentType && <span className="jv-type">{currentType}</span>}
                    <span className="jv-meta">{size} items</span>
                    <span>{isArray ? "[" : "{"} </span>
                </div>
            </div>}
            <div className="jv-value">
                {Object
                    .entries(groupedChilds)
                    .map(([name, value], index) => ({
                        name, value,
                        path: [...path, value instanceof GroupedObject ? String(index) : name]
                    }))
                    .map(({ name, value, path }) => <JSONViewCurr
                        {...{
                            name,
                            value,
                            path,
                            context,
                            expandLevel: childExpandLevel,
                            isGrouped: shouldGroup,
                        }}
                        key={path.join("/")} />)}
            </div>
            {name && <div>
                <span> {isArray ? "]" : "}"} </span>
            </div>}
        </> : <>
            <div>
                <div onClick={() => ableToExpand && setExpand(true)}>
                    {displayName && <span className="jv-name">{name}</span>}
                    {displayName && name && <span>:</span>}
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

    const { currentType, name, value, } = props;

    const { isExpand, setExpand } = useExpandState(props);

    const useExpand = String(value).length > 50;

    const renderString = useExpand && !isExpand
        ? `${String(value).slice(0, 15)}...${String(value).slice(-15, -1)}`
        : String(value);

    return <ChangeFlashWrappper
        value={props.value}
        className={`jv-field jv-field-${currentType} ${useExpand ? 'jv-cursor' : ''}`}
        onClick={() => setExpand(!isExpand)}>
        <span className="jv-name">{name}</span>
        <span>:</span>
        <span className="jv-type">{currentType}{useExpand && <> lng={value?.length}</>}</span>
        <span className="jv-value">"{renderString}"</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

const FunctionViewObj: React.FC<JSONViewProps> = (props) => {
    const { currentType, name, value, } = props;
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
        <span className="jv-name">{name}</span>
        <span>:</span>
        <span className="jv-type">{currentType}</span>
        <span className="jv-value">"{renderString}"</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

const DefaultValueView: React.FC<JSONViewProps> = (props) => {

    const { currentType, name, value, } = props;

    return <ChangeFlashWrappper
        value={props.value}
        className={`jv-field jv-field-${currentType}`}>
        <span className="jv-name">{name}</span>
        <span>:</span>
        <span className="jv-type">{currentType}</span>
        <span className="jv-value">{String(value)}</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

const SIMPLE_INSTANCE_RENDER = new Set([
    Date,
    RegExp,
])



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




export const MapView: React.FC<JSONViewProps> = (props) => {
    const value = useMemo(
        () => props.value instanceof Map
            ? Object.fromEntries([...props.value.entries()])
            : {},
        [props.value]
    )

    return <JSONViewObj
        {...props}
        {...{ currentType: "Map", value }}
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
        {...{ currentType: "Set", displayName: false, value }}
    />
}

export const ObjectView: React.FC<{
    value: any;
    name?: string; style?: any;
    expandLevel?: number | boolean;
    objectGrouped?: number,
    arrayGrouped?: number,
}> = ({ value, name, style, expandLevel = false, objectGrouped = 25, arrayGrouped = 10 }) => {

    const [expandRoot, setExpandRoot] = useState<Record<string, boolean>>({});
    const context: JSONViewCtx = useMemo(() => ({
        expandRoot, setExpandRoot,
        objectGrouped,
        arrayGrouped,
    }), [expandRoot, setExpandRoot, objectGrouped, arrayGrouped])

    return <div className="jv-root" style={style}>
        <JSONViewCurr
            path={[]}
            {...{ name, value, context, expandLevel }} />
    </div>;
};
