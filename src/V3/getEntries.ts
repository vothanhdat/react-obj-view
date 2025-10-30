export const getEntries = function* (value: any) {
    if (!value)
        return;
    if (value instanceof Array) {
        for (let key = 0; key < value.length; key++) {
            yield { key, value: value[key], enumerable: true };
        }
    } else if (value instanceof Object) {
        for (var key in value) {
            yield { key, value: value[key], enumerable: true };
        }
    }
};
