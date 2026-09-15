import { expectTypeOf, it } from 'vitest';
import type { RefCallback, RefObject } from 'react';
import type { ObjectViewHandle, ObjectViewProps } from './types';

it('accepts nullable object refs', () => {
    expectTypeOf<RefObject<ObjectViewHandle | null>>().toExtend<ObjectViewProps['ref']>();
});

it('preserves support for undefined object refs', () => {
    expectTypeOf<RefObject<ObjectViewHandle | undefined>>().toExtend<ObjectViewProps['ref']>();
});

it('accepts callback refs', () => {
    expectTypeOf<RefCallback<ObjectViewHandle>>().toExtend<ObjectViewProps['ref']>();
});
