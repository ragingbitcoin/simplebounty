import { useMemo } from 'react';

export const useBasename = () => {
  return useMemo(() => {
    // Extract basename only if there's an spg- pattern
    const pathname = window.location.pathname;
    const spgMatch = pathname.match(/^(.*?)\/spg-/);
    return spgMatch ? spgMatch[1] : '';
  }, []);
}; 