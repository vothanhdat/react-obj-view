import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionRenders } from './Actions';
import type { ObjectViewRenderRowProps } from '../types';

describe('DefaultActions', () => {
    let writeTextMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Mock clipboard API
        writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: writeTextMock,
            },
            writable: true,
            configurable: true,
        });

        // Mock requestIdleCallback to execute immediately
        (window as any).requestIdleCallback = (cb: Function) => {
            cb();
            return 0;
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createMockProps = (value: any): ObjectViewRenderRowProps => ({
        valueWrapper: () => value,
        nodeDataWrapper: () => ({ value, key: 'test', parent: null, level: 0, index: 0 }),
        actions: {} as any,
        options: {} as any,
        renderIndex: 0,
    });

    it('should render Copy button for string values', () => {
        const props = createMockProps('test string');
        render(<ActionRenders {...props} />);

        expect(screen.getByText('Copy Text')).toBeInTheDocument();
        expect(screen.queryByText('Copy JSON')).not.toBeInTheDocument();
    });

    it('should render Copy button for number values', () => {
        const props = createMockProps(42);
        render(<ActionRenders {...props} />);

        expect(screen.getByText('Copy Text')).toBeInTheDocument();
        expect(screen.queryByText('Copy JSON')).not.toBeInTheDocument();
    });

    it('should render Copy button for bigint values', () => {
        const props = createMockProps(BigInt(123));
        render(<ActionRenders {...props} />);

        expect(screen.getByText('Copy Text')).toBeInTheDocument();
        expect(screen.queryByText('Copy JSON')).not.toBeInTheDocument();
    });

    it('should render Copy JSON button for plain objects', () => {
        const props = createMockProps({ name: 'John', age: 30 });
        render(<ActionRenders {...props} />);

        expect(screen.queryByText('Copy Text')).not.toBeInTheDocument();
        expect(screen.getByText('Copy JSON')).toBeInTheDocument();
    });

    it('should render Copy JSON button for arrays', () => {
        const props = createMockProps([1, 2, 3]);
        render(<ActionRenders {...props} />);

        expect(screen.getByText('Copy JSON')).toBeInTheDocument();
    });

    it('should not render buttons for null', () => {
        const props = createMockProps(null);
        render(<ActionRenders {...props} />);

        expect(screen.queryByText('Copy Text')).not.toBeInTheDocument();
        expect(screen.queryByText('Copy JSON')).not.toBeInTheDocument();
    });

    it('should not render buttons for functions', () => {
        const props = createMockProps(() => {});
        render(<ActionRenders {...props} />);

        expect(screen.queryByText('Copy Text')).not.toBeInTheDocument();
        expect(screen.queryByText('Copy JSON')).not.toBeInTheDocument();
    });

    it('should copy string value when Copy is clicked', async () => {
        const props = createMockProps('test value');
        render(<ActionRenders {...props} />);

        const copyButton = screen.getByText('Copy Text');
        fireEvent.click(copyButton);

        // Wait for async operations and state updates
        await waitFor(() => {
            expect(screen.getByText('✓ SUCCESS')).toBeInTheDocument();
        });

        expect(writeTextMock).toHaveBeenCalledWith('test value');
    });

    it('should copy JSON when Copy JSON is clicked', async () => {
        const obj = { name: 'John', age: 30 };
        const props = createMockProps(obj);
        render(<ActionRenders {...props} />);

        const copyButton = screen.getByText('Copy JSON');
        fireEvent.click(copyButton);

        // Wait for async operations and state updates
        await waitFor(() => {
            expect(screen.getByText('✓ SUCCESS')).toBeInTheDocument();
        });

        expect(writeTextMock).toHaveBeenCalledWith(JSON.stringify(obj));
    });

    it('should not render Copy JSON for objects with non-standard prototypes', () => {
        class CustomClass {}
        const props = createMockProps(new CustomClass());
        render(<ActionRenders {...props} />);

        expect(screen.queryByText('Copy JSON')).not.toBeInTheDocument();
    });
});
