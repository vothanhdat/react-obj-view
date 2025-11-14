

export function isRef(value: any) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}