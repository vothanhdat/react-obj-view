import { memo, use } from "react";
import { InternalPromise } from "../V5/resolvers/promise";

const getValueDefault = (props: any) => props.value

const transformPropsDefault = (value: any) => ({ value }) as any

export const PromiseWrapper: React.FC<any> = ({ Component, getValue, transformProps, ...props }) => {
    const value = getValue(props);
    if (value instanceof InternalPromise) {
        const resolved = use(value.promise)
        return <Component {...props}  {...transformProps(resolved)} />;
    } else {
        return <Component {...props} />;
    }

};

export const withPromiseWrapper = <T,>(
    Component: React.FC<T>,
    getValue = getValueDefault,
    transformProps = transformPropsDefault,
) => {
    return memo(
        function Wrapper(props: T) {
            return <PromiseWrapper {...props}
                Component={Component}
                getValue={getValue}
                transformProps={transformProps}
            />
        }
    )
}