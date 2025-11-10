import { joinClasses } from "./joinClasses";
import { ResolverFn } from "../V5/types";
import { RenderPreview } from "./RenderPreview";
import { RenderRawValue } from "./RenderRawValue";
import { useWrapper } from "../hooks/useWrapper";
import { withPromiseWrapper } from "./PromiseWrapper";
import { useLazyValue } from "../hooks/useLazyValue";
import { RenderOptions } from "./RenderNode";


const RenderValueDefault: React.FC<{
    valueWrapper: any;
    isPreview: boolean;
    options: RenderOptions,
    depth?: number;
}> = (({ valueWrapper, isPreview, options, depth = 0 }) => {
    const { refreshPath } = options
    
    const value = valueWrapper()

    const { isLazyValue, lazyValueEmit, lazyValueInited, renderValue } = useLazyValue({ value, refreshPath })

    const renderValueWrapper = useWrapper(renderValue)

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


export const RenderValue = withPromiseWrapper(
    RenderValueDefault,
    ({ valueWrapper }) => valueWrapper(),
    (value) => ({ valueWrapper: useWrapper(value) })
)

