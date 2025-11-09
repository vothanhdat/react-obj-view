
export const hasOwnProperty = Object.prototype.hasOwnProperty;
export const propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

export function getPropertyValue(object: any, propertyName: PropertyKey) {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(object, propertyName);
    if (propertyDescriptor?.get) {
        try {
            return propertyDescriptor.get.call(object);
        } catch {

        }
    }

    try {
        return object[propertyName];
    } catch {

    }
    return undefined
}


