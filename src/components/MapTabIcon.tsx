import Svg, { Circle, Path } from 'react-native-svg';

type MapTabIconProps = {
  /** Pin fill and map outline color. */
  color: string;
  /** Color behind the icon; used for the pin's hole and its cut-out edge. */
  background: string;
  size?: number;
};

/** Folded map with the same location pin used for towns on the map page. */
export function MapTabIcon({ color, background, size = 22 }: MapTabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M2 11.5l6-2 8 2 6-2v11l-6 2-8-2-6 2z"
        fill="none"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Path d="M8 9.5v11M16 11.5v11" stroke={color} strokeWidth={1.7} />
      <Path
        d="M12 1.2c-3.1 0-5.6 2.5-5.6 5.6 0 4.2 5.6 9.7 5.6 9.7s5.6-5.5 5.6-9.7c0-3.1-2.5-5.6-5.6-5.6z"
        fill={color}
        stroke={background}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={6.8} r={2.1} fill={background} />
    </Svg>
  );
}
