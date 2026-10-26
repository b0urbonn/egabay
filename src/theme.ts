export type ThemeColors = {
  ink: string;
  muted: string;
  canvas: string;
  card: string;
  line: string;
  green: string;
  greenDark: string;
  greenLight: string;
  lime: string;
  onLime: string;
  orange: string;
  orangeDark: string;
  orangeLight: string;
  blue: string;
  blueLight: string;
  purple: string;
  purpleLight: string;
  quickIcon: string;
  quickIconAccent: string;
  red: string;
  chipBg: string;
  statusBg: string;
  onTime: string;
  connector: string;
  disabled: string;
  tipBg: string;
  tipBody: string;
  mapSea: string;
  mapLand: string;
  mapLabel: string;
  mapSampleBg: string;
  selectedCardBg: string;
  connectBorder: string;
  connectBg: string;
  connectTitle: string;
  connectBody: string;
  fill: string;
};

export const lightColors: ThemeColors = {
  ink: '#18231E',
  muted: '#6E7A73',
  canvas: '#F4F6F2',
  card: '#FFFFFF',
  line: '#E5EAE4',
  green: '#176B4B',
  greenDark: '#10543A',
  greenLight: '#E5F3EA',
  lime: '#C6F06A',
  onLime: '#10543A',
  orange: '#E9813F',
  orangeDark: '#8A430B',
  orangeLight: '#FFF0E4',
  blue: '#0A66C2',
  blueLight: '#E8F3FF',
  purple: '#6F42C1',
  purpleLight: '#F1EAFE',
  quickIcon: '#176B4B',
  quickIconAccent: '#E9813F',
  red: '#B5473A',
  chipBg: '#FBFCFA',
  statusBg: '#F0F7EF',
  onTime: '#50A669',
  connector: '#CED9CF',
  disabled: '#B9C4BC',
  tipBg: '#F0F6EC',
  tipBody: '#5E7566',
  mapSea: '#DFEBE7',
  mapLand: '#B8D7C1',
  mapLabel: '#FFFFFF',
  mapSampleBg: 'rgba(255,255,255,0.85)',
  selectedCardBg: '#F7FBF6',
  connectBorder: '#F0D8C2',
  connectBg: '#FFF8F1',
  connectTitle: '#8C4B22',
  connectBody: '#916A50',
  fill: 'rgba(118,118,128,0.12)',
};

export const darkColors: ThemeColors = {
  ink: '#EAF1EC',
  muted: '#93A29A',
  canvas: '#0F1512',
  card: '#1B231E',
  line: '#2C3730',
  green: '#1E7A55',
  greenDark: '#A9DFC2',
  greenLight: '#1F3329',
  lime: '#C6F06A',
  onLime: '#10543A',
  orange: '#F09A5F',
  orangeDark: '#F5AF78',
  orangeLight: '#332519',
  blue: '#8FC7FF',
  blueLight: '#19314A',
  purple: '#D6B7FF',
  purpleLight: '#342744',
  quickIcon: '#FFFFFF',
  quickIconAccent: '#FFFFFF',
  red: '#E07A6A',
  chipBg: '#212A24',
  statusBg: '#203328',
  onTime: '#63B87F',
  connector: '#3B4740',
  disabled: '#45524A',
  tipBg: '#1C2A22',
  tipBody: '#9DB4A5',
  mapSea: '#17231D',
  mapLand: '#2E4A38',
  mapLabel: '#26332B',
  mapSampleBg: 'rgba(38,51,43,0.9)',
  selectedCardBg: '#1C2921',
  connectBorder: '#4B3A28',
  connectBg: '#2A2118',
  connectTitle: '#F0A868',
  connectBody: '#C79A7C',
  fill: 'rgba(118,118,128,0.24)',
};

export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 } as const;

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 } as const;
