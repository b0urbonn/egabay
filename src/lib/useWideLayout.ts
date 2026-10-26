import { Platform, useWindowDimensions } from 'react-native';

/** True on wide web viewports (≥1024 px) where the shell shows the desktop rail. */
export function useWideLayout() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= 1024;
}
