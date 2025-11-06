import { memo, use } from "react";
import { InternalPromise } from "../V3/resolver";

const PromiseResolver: React.FC<any> = ({ Component, ...props }) => {
    let value = use(props.value);
    return <Component {...props} value={value} />;
};


export const PromiseWrapper: React.FC<any> = ({ Component, ...props }) => {

    if (props.value instanceof InternalPromise) {
        return <PromiseResolver {...props} Component={Component} value={props.value.promise} />;
    } else {
        return <Component {...props} />;
    }

};


export const withPromiseWrapper = <T,>(Component: React.FC<T>) => {
    return memo(
        function Wrapper(props: T) { return <PromiseWrapper {...props} Component={Component} /> }
    )
}