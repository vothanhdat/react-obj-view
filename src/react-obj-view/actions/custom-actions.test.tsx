import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ObjectView } from '../ObjectView';
import { CustomAction } from "./types";
import React from 'react';

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
});
