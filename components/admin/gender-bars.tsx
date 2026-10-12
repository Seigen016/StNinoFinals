import { Bar } from 'recharts';

// Male/female colors validated for colorblind separation and contrast; unspecified is neutral gray
const SERIES = [
  { key: 'male', name: 'Male', fill: '#2a78d6' },
  { key: 'female', name: 'Female', fill: '#d55181' },
  { key: 'unspecified', name: 'Unspecified', fill: '#d1d5db' },
] as const;

// recharts only reads <Bar> as a direct child of the chart, so this returns
// the elements instead of being a component. Rows need male/female/unspecified.
export function genderBars(layout: 'horizontal' | 'vertical', onClick?: (row: any) => void) {
  const end = layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0];
  return SERIES.map((s, i) => (
    <Bar
      key={s.key}
      dataKey={s.key}
      name={s.name}
      stackId="gender"
      fill={s.fill}
      stroke="#ffffff"
      strokeWidth={2}
      radius={i === SERIES.length - 1 ? (end as [number, number, number, number]) : 0}
      cursor={onClick ? 'pointer' : undefined}
      onClick={onClick}
    />
  ));
}
