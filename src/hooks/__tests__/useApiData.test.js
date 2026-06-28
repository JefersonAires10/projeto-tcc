import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useApiData from '../useApiData';

describe('useApiData', () => {
  it('inicia com loading true, data null, error null', () => {
    const { result } = renderHook(() => useApiData(() => Promise.resolve('data'), []));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('retorna dados após fetch bem-sucedido', async () => {
    const fetcher = vi.fn().mockResolvedValue('dados');
    const { result } = renderHook(() => useApiData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe('dados');
    expect(result.current.error).toBeNull();
  });

  it('retorna erro quando fetch falha', async () => {
    const error = new Error('falha na API');
    const fetcher = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useApiData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it('chama fetcher novamente quando deps mudam', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { result, rerender } = renderHook(
      ({ id }) => useApiData(() => fetcher(id), [id]),
      { initialProps: { id: 1 } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(1);

    rerender({ id: 2 });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(fetcher).toHaveBeenCalledWith(2);
  });

  it('setData atualiza data manualmente', async () => {
    const fetcher = vi.fn().mockResolvedValue('original');
    const { result } = renderHook(() => useApiData(fetcher, []));

    await waitFor(() => expect(result.current.data).toBe('original'));
    act(() => result.current.setData('modificado'));
    expect(result.current.data).toBe('modificado');
  });

  it('não atualiza estado após desmontagem', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { result, unmount } = renderHook(() => useApiData(fetcher, []));
    unmount();
    await vi.waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });

  it('setLoad atualiza loading manualmente', async () => {
    const fetcher = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useApiData(fetcher, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setLoad(true));
    expect(result.current.loading).toBe(true);
  });
});
