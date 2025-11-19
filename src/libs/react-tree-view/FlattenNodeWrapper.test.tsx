import { describe, it, expect, vi } from 'vitest';
import { FlattenNodeWrapper } from './FlattenNodeWrapper';

describe('FlattenNodeWrapper', () => {
    const mockMetaParser = vi.fn((meta) => ({ parsed: meta }));
    const mockState = {
        childCount: 5,
        meta: 'test-meta',
        value: 'test-value',
        key: 'test-key',
        expanded: true,
    };

    it('should initialize correctly', () => {
        const wrapper = new FlattenNodeWrapper(
            mockMetaParser,
            mockState as any,
            2,
            ['root', 'child'],
            [0, 1]
        );

        expect(wrapper.depth).toBe(2);
        expect(wrapper.paths).toEqual(['root', 'child']);
        expect(wrapper.parentIndex).toEqual([0, 1]);
        expect(wrapper.state).toBe(mockState);
    });

    it('should calculate path correctly', () => {
        const wrapper = new FlattenNodeWrapper(
            mockMetaParser,
            mockState as any,
            2,
            ['root', 'child'],
            [0, 1]
        );

        expect(wrapper.path).toBe('root/child');
    });

    it('should handle non-string keys in path', () => {
        const wrapper = new FlattenNodeWrapper(
            mockMetaParser,
            mockState as any,
            2,
            ['root', Symbol('sym')],
            [0, 1]
        );

        expect(wrapper.path).toBe('root/Symbol(sym)');
    });

    it('should return childCount from state', () => {
        const wrapper = new FlattenNodeWrapper(
            mockMetaParser,
            mockState as any,
            2,
            ['root'],
            [0]
        );

        expect(wrapper.childCount).toBe(5);
    });

    it('should return flattened data', () => {
        const wrapper = new FlattenNodeWrapper(
            mockMetaParser,
            mockState as any,
            2,
            ['root', 'child'],
            [0, 1]
        );

        const data = wrapper.getData();

        expect(data).toEqual({
            ...mockState,
            parsed: 'test-meta',
            depth: 2,
            path: 'root/child',
            paths: ['root', 'child'],
            parents: [0, 1],
        });
        expect(mockMetaParser).toHaveBeenCalledWith('test-meta');
    });
});
