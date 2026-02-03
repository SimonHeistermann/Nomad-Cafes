import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, render, fireEvent, act } from '@testing-library/react';
import { InfoIcon } from '../InfoIcon';

describe('InfoIcon - Popover Hover Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows popover on icon hover', () => {
    render(<InfoIcon content="Test tooltip content" />);

    const wrapper = document.querySelector('.info-icon-wrapper');

    // Trigger mouseenter
    fireEvent.mouseEnter(wrapper!);

    // Popover should appear
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
  });

  it('keeps popover visible when moving mouse from icon to popover', () => {
    render(<InfoIcon content="Test tooltip content" />);

    const wrapper = document.querySelector('.info-icon-wrapper');

    // Hover to show popover
    fireEvent.mouseEnter(wrapper!);
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();

    // Leave wrapper (starts timeout)
    fireEvent.mouseLeave(wrapper!);

    // Fast forward 100ms (less than 150ms timeout)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Popover should still be visible because timeout hasn't completed
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();

    // Hover the tooltip itself before timeout completes
    const tooltip = screen.getByText('Test tooltip content').closest('.info-icon-tooltip');
    fireEvent.mouseEnter(tooltip!);

    // Fast forward past timeout
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Popover should still be visible because we're hovering it
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
  });

  it('hides popover when mouse leaves both icon and popover', () => {
    render(<InfoIcon content="Test tooltip content" />);

    const wrapper = document.querySelector('.info-icon-wrapper');

    // Hover
    fireEvent.mouseEnter(wrapper!);
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();

    // Leave
    fireEvent.mouseLeave(wrapper!);

    // Fast forward timeout (150ms) wrapped in act
    act(() => {
      vi.advanceTimersByTime(151);
    });

    // Popover should disappear
    expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
  });

  it('cancels hide timeout when re-hovering icon', () => {
    render(<InfoIcon content="Test tooltip content" />);

    const wrapper = document.querySelector('.info-icon-wrapper');

    // Hover
    fireEvent.mouseEnter(wrapper!);
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();

    // Leave (starts timeout)
    fireEvent.mouseLeave(wrapper!);

    // Fast forward 50ms (before timeout completes)
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Hover again (should cancel timeout)
    fireEvent.mouseEnter(wrapper!);

    // Fast forward remaining time
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Popover should still be visible
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
  });

  it('shows popover on focus for keyboard accessibility', () => {
    render(<InfoIcon content="Test tooltip content" />);

    const icon = screen.getByRole('button', { name: /information/i });

    // Focus the button
    fireEvent.focus(icon);

    // Popover should appear
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();
  });

  it('hides popover on blur', () => {
    render(<InfoIcon content="Test tooltip content" />);

    const icon = screen.getByRole('button', { name: /information/i });

    // Focus to show
    fireEvent.focus(icon);
    expect(screen.getByText('Test tooltip content')).toBeInTheDocument();

    // Blur to hide
    fireEvent.blur(icon);

    expect(screen.queryByText('Test tooltip content')).not.toBeInTheDocument();
  });

  it('renders with custom position', () => {
    render(<InfoIcon content="Test content" position="top" />);

    const icon = screen.getByRole('button', { name: /information/i });
    fireEvent.focus(icon);

    const tooltip = screen.getByText('Test content').closest('.info-icon-tooltip');
    expect(tooltip).toHaveClass('info-icon-tooltip--top');
  });
});
