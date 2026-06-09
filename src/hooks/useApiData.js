import { useState, useEffect } from 'react';

export default function useApiData(fetcher, deps) {
  const [loading, setLoad] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoad(true);
      setError(null);
      try {
        const result = await fetcher();
        if (mounted) setData(result);
      } catch (err) {
        if (mounted) setError(err);
      } finally {
        if (mounted) setLoad(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, deps);

  return { loading, data, error, setData, setLoad };
}
