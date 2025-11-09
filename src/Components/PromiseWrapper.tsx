import { memo, use } from "react";
import { InternalPromise } from "../V5/resolver";

const getValueDefault = (props: any) => props.value
const transformPropsDefault = (value: any) => ({ value }) as any

const PromiseResolver: React.FC<any> = ({ Component, transformProps, ...props }) => {
    let value = use(props.value);
    return <Component {...props} {...transformProps(value)} />;
};


export const PromiseWrapper: React.FC<any> = ({ Component, getValue, ...props }) => {
    const value = getValue(props);
    if (value instanceof InternalPromise) {
        return <PromiseResolver {...props} Component={Component} value={value.promise} />;
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