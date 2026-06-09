import { useEffect, useRef } from 'react';

export function useChart(canvasRef, chartRef, createChart, deps) {
  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = createChart(canvasRef.current);
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, deps);
}
