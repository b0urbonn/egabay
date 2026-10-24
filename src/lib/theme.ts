import { createContext, useContext, useMemo } from 'react';

import { lightColors, type ThemeColors } from '../theme';

export const ColorsContext = createContext<ThemeColors>(lightColors);

export function useColors(): ThemeColors {
  return useContext(ColorsContext);
}

export function useThemeStyles<T>(factory: (colors: ThemeColors) => T): T {
  const colors = useContext(ColorsContext);
  return useMemo(() => factory(colors), [factory, colors]);
}
