import { joinClasses } from "../../utils/joinClasses";
import { RenderPreview } from "./RenderPreview";
import { RenderRawValue } from "./RenderRawValue";
import { useWrapper } from "../../libs/react-tree-view/useWrapper";
import { useLazyValue } from "../hooks/useLazyValue";
import { RenderOptions } from "../types";
import { useInternalPromise } from "../hooks/useInternalPromiseResolve";


export const RenderValue: React.FC<{
    valueWrapper: any;
    isPreview: boolean;
    options: RenderOptions,
    depth?: number;
    refreshPath?: () => void,
}> = (({ valueWrapper, isPreview, options, refreshPath, depth = 0 }) => {

    const { isLazyValue, lazyValueEmit, lazyValueInited, renderValue: value } = useLazyValue({
        value: useInternalPromise(valueWrapper()),
        refreshPath
    })

    const renderValueWrapper = useWrapper(value)

    const children = <>
        {isPreview
            ? <RenderPreview valueWrapper={renderValueWrapper} options={options} depth={depth} />
            : <RenderRawValue valueWrapper={renderValueWrapper} depth={depth} options={options} />}
    </>

    return <span
        onClick={lazyValueEmit}
        className={joinClasses(
            "value",
            `type-${typeof value}`,
            isPreview && 'value-preview',
            value == null && 'type-null',
            isLazyValue && 'pointer-cursor',
            value?.constructor?.name ? `type-object-${value?.constructor?.name}`?.toLowerCase() : ``
        )}>
        {isLazyValue
            ? <> {lazyValueInited ? children : "(...)"} </>
            : children}
    </span>;
});

