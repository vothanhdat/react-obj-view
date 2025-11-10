import { joinClasses } from "./joinClasses";
import { ResolverFn } from "../V5/types";
import { RenderPreview } from "./RenderPreview";
import { RenderRawValue } from "./RenderRawValue";
import { useWrapper } from "../hooks/useWrapper";
import { withPromiseWrapper } from "./PromiseWrapper";
import { useLazyValue } from "../hooks/useLazyValue";


const RenderValueDefault: React.FC<{
    valueWrapper: any;
    isPreview: boolean;
    resolver?: Map<any, ResolverFn>;
    depth?: number;
    refreshPath?: () => void
}> = (({ valueWrapper, isPreview, resolver, refreshPath, depth = 0 }) => {

    const value = valueWrapper()

    const { isLazyValue, lazyValueEmit, lazyValueInited, renderValue } = useLazyValue({ value, refreshPath })

    const renderValueWrapper = useWrapper(renderValue)

    const children = <>
        {isPreview
            ? <RenderPreview valueWrapper={renderValueWrapper} resolver={resolver} depth={depth} />
            : <RenderRawValue valueWrapper={renderValueWrapper} depth={depth} />}
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


export const RenderValue = withPromiseWrapper(
    RenderValueDefault,
    ({ valueWrapper }) => valueWrapper(),
    (value) => ({ valueWrapper: useWrapper(value) })
)

