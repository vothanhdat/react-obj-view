export const immutableNestedUpdate = (current: any, updater: (e: any) => any, paths: PropertyKey[]): any => {
    if (paths.length) {
        const [path, ...rest] = paths;
        return {
            ...current || {},
            [path]: immutableNestedUpdate(current?.[path], updater, rest)
        };
    } else {
        return updater(current);
    }
};
