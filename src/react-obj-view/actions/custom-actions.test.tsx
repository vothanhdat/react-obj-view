import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ObjectView } from '../ObjectView';
import { ActionWrapperProps, CustomAction } from "./types";
import React from 'react';
import { ActionRender } from './ActionRender';

describe('ObjectView customActions', () => {
    it('should render custom action button on hover', async () => {
        const user = userEvent.setup();
        const customAction: CustomAction<{ label: string }> = {
            name: 'test-action',
            prepareAction: (nodeData) => {
                return { label: 'Click Me' };
            },
            performAction: async () => { },
            actionRender: ({ label }) => <span>{label}</span>,
            actionRunRender: 'Running...',
        };

        render(<ObjectView valueGetter={() => ({ test: 123 })} customActions={[customAction]} style={{ height: 500 }} />);

        const keyElement = await screen.findByText('test');
        const nodeDefault = keyElement.closest('.node-default');
        expect(nodeDefault).toBeTruthy();
        
        // Simulate hover
        await user.hover(nodeDefault!);
        
        // Wait for the action to appear (there is a 40ms delay)
        await waitFor(() => {
            expect(screen.getByText('Click Me')).toBeTruthy();
        });
    });

    it('should execute performAction on click', async () => {
        const user = userEvent.setup();
        const performActionMock = vi.fn().mockResolvedValue(undefined);
        const customAction: CustomAction = {
            name: 'test-action',
            prepareAction: () => ({}),
            performAction: performActionMock,
            actionRender: 'Action',
            actionRunRender: 'Running...',
        };

        render(<ObjectView valueGetter={() => ({ test: 123 })} customActions={[customAction]} style={{ height: 500 }} />);
        
        const keyElement = await screen.findByText('test');
        const nodeDefault = keyElement.closest('.node-default');
        await user.hover(nodeDefault!);
        
        const actionBtn = await screen.findByText('Action');
        fireEvent.click(actionBtn);
        
        await waitFor(() => {
            expect(performActionMock).toHaveBeenCalled();
        });
    });

    it('should show loading state during execution', async () => {
        const user = userEvent.setup();
        let resolveAction: () => void;
        const performActionPromise = new Promise<void>(resolve => {
            resolveAction = resolve;
        });

        const customAction: CustomAction = {
            name: 'async-action',
            prepareAction: () => ({}),
            performAction: () => performActionPromise,
            actionRender: 'Start',
            actionRunRender: 'Loading...',
            actionSuccessRender: 'Done'
        };

        render(<ObjectView valueGetter={() => ({ test: 123 })} customActions={[customAction]} style={{ height: 500 }} />);
        
        const keyElement = await screen.findByText('test');
        const nodeDefault = keyElement.closest('.node-default');
        await user.hover(nodeDefault!);
        
        const startBtn = await screen.findByText('Start');
        fireEvent.click(startBtn);
        
        await waitFor(() => {
            expect(screen.getByText('Loading...')).toBeTruthy();
        });

        // Finish action
        resolveAction!();

        await waitFor(() => {
            expect(screen.getByText('Done')).toBeTruthy();
        });
    });

    it('should honor buttonWrapper and reset after resetTimeout', async () => {
        vi.useFakeTimers();

        try {
            const nodeData = {
                key: 'test',
                value: 123,
                parent: null,
                level: 0,
                index: 0,
            } as any;

            let resolveAction: () => void;
            const performActionPromise = new Promise<void>((resolve) => {
                resolveAction = resolve;
            });

            const performActionMock = vi.fn(() => performActionPromise);

            const ButtonWrapper: React.FC<ActionWrapperProps<any>> = ({
                isLoading,
                isSuccess,
                isError,
                handleAction,
                children,
            }) => (
                <button
                    type="button"
                    data-testid="custom-wrapper"
                    data-loading={String(isLoading)}
                    data-success={String(isSuccess)}
                    data-error={String(!!isError)}
                    onClick={handleAction}
                >
                    {children}
                </button>
            );

            render(
                <ActionRender
                    renderIndex={0}
                    nodeDataWrapper={() => nodeData}
                    valueWrapper={() => nodeData.value}
                    options={{} as any}
                    actions={{ refreshPath: vi.fn(), toggleChildExpand: vi.fn() } as any}
                    name="wrapped-action"
                    prepareAction={() => ({})}
                    performAction={performActionMock}
                    actionRender="Run"
                    actionRunRender="Running..."
                    actionSuccessRender="Done"
                    resetTimeout={25}
                    buttonWrapper={ButtonWrapper}
                />
            );

            const wrappedButton = screen.getByTestId('custom-wrapper');
            expect(wrappedButton.textContent).toContain('Run');
            expect(wrappedButton.getAttribute('data-loading')).toBe('false');
            expect(wrappedButton.getAttribute('data-success')).toBe('false');

            fireEvent.click(wrappedButton);
            await act(async () => {
                await Promise.resolve();
            });
            expect(performActionMock).toHaveBeenCalledTimes(1);
            expect(screen.getByText('Running...')).toBeTruthy();

            await act(async () => {
                resolveAction!();
                await Promise.resolve();
            });

            expect(screen.getByText('Done')).toBeTruthy();

            await act(async () => {
                vi.advanceTimersByTime(30);
            });

            expect(screen.getByText('Run')).toBeTruthy();
        } finally {
            vi.useRealTimers();
        }
    });
});
