import React, { useMemo } from "react";
import { ChangeFlashWrappper } from "../utils/ChangeFlashWrappper";
import { GroupedObject, toGrouped } from "../utils/GroupedObject";
import { JSONViewProps } from "./JSONViewProps";
import { PreviewValue } from "./PreviewValue";
import { useExpandState } from "./hooks/useExpandState";
import { ObjectRouter } from "./ObjectRouter";
import { createMemorizeMap } from "../utils/createMemorizeMap";

export const ObjectDetailView: React.FC<JSONViewProps & { childDisplayName?: boolean; childSeperator?: string; }> = (props) => {

    const {
        value, name, expandLevel, context, currentType, displayName = true, childDisplayName = true, seperator = ":", childSeperator = ":", trace = [], path = [],
    } = props;

    const isCircular = useMemo(
        () => {
            if (value && trace.length) {
                let idx = trace.indexOf(value);
                return !(idx == -1 || idx == trace.length - 1);
            } else {
                return false;
            }
        },
        [trace, value]
    );

    const { isExpand, setExpand, expandKeys } = useExpandState(props, isCircular);

    const { objectGrouped, arrayGrouped, highlightUpdate } = context;

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

    const childPropsFactory = useMemo(
        () => createMemorizeMap((name, value, index) => ({
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
        })),
        [childDisplayName, childSeperator, trace, path]
    )


    const childsProps = useMemo(
        () => Object
            .entries(groupedChilds)
            .map(([name, value], index) => childPropsFactory(name, value, index)),
        [groupedChilds, childDisplayName, childSeperator, trace, path]
    )


    return <ChangeFlashWrappper className={"jv-field jv-field-obj jv-field-" + currentType} value={value} enable={highlightUpdate}>
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
                {childsProps.map((props) => <ObjectRouter
                    key={props.path.join("/")}
                    {...{
                        ...props,
                        context,
                        expandLevel: childExpandLevel,
                        isGrouped: shouldGroup,
                    }}
                />)}
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
                    {ableToExpand && <PreviewValue {...{ value, size, }} />}
                    <span>{isArray ? "]" : "}"}</span>
                </div>
            </div>
        </>}
    </ChangeFlashWrappper>;
};


