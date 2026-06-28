import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChart } from '../useChart';

describe('useChart', () => {
  it('cria chart quando canvasRef está disponível', () => {
    const canvasRef = { current: document.createElement('canvas') };
    const chartRef = { current: null };
    const createChart = vi.fn(() => ({ destroy: vi.fn() }));

    renderHook(() => useChart(canvasRef, chartRef, createChart, []));

    expect(createChart).toHaveBeenCalledWith(canvasRef.current);
  });

  it('não cria chart quando canvasRef é null', () => {
    const canvasRef = { current: null };
    const chartRef = { current: null };
    const createChart = vi.fn();

    renderHook(() => useChart(canvasRef, chartRef, createChart, []));

    expect(createChart).not.toHaveBeenCalled();
  });

  it('destroi chart anterior quando deps mudam', () => {
    const destroy = vi.fn();
    const canvasRef = { current: document.createElement('canvas') };
    const chartRef = { current: { destroy } };
    const createChart = vi.fn(() => ({ destroy: vi.fn() }));

    const { rerender } = renderHook(
      ({ deps }) => useChart(canvasRef, chartRef, createChart, deps),
      { initialProps: { deps: [1] } }
    );

    rerender({ deps: [2] });

    expect(destroy).toHaveBeenCalledOnce();
    expect(createChart).toHaveBeenCalledTimes(2);
  });

  it('destroi chart no cleanup ao desmontar', () => {
    const destroy = vi.fn();
    const canvasRef = { current: document.createElement('canvas') };
    const chartRef = { current: null };
    const createChart = vi.fn(() => ({ destroy }));

    const { unmount } = renderHook(() => useChart(canvasRef, chartRef, createChart, []));

    unmount();

    expect(destroy).toHaveBeenCalledOnce();
    expect(chartRef.current).toBeNull();
  });

  it('não quebra se chartRef.current for null no cleanup', () => {
    const canvasRef = { current: document.createElement('canvas') };
    const chartRef = { current: null };
    const createChart = vi.fn(() => ({ destroy: vi.fn() }));

    const { unmount } = renderHook(() => useChart(canvasRef, chartRef, createChart, []));

    expect(() => unmount()).not.toThrow();
  });
});
