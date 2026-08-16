import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';

const light = { ...colors.light, radius: colors.radius };
const dark = { ...colors.dark, radius: colors.radius };

export type AppColors = typeof light;

export function useColors(): AppColors {
  const scheme = useColorScheme();
  // Adrift is always dark-themed regardless of system setting
  return scheme === 'dark' ? dark : light;
}
