import type { ComponentType, ReactElement, SVGProps } from 'react';
import { cx } from '../../utils/cx';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
export type IconColor =
  'inherit' | 'primary' | 'secondary' | 'muted' | 'gain' | 'loss' | 'warning' | 'critical';

export interface IconProps extends SVGProps<SVGSVGElement> {
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  readonly size?: IconSize;
  readonly color?: IconColor;
}

const SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const COLOR_MAP: Record<IconColor, string> = {
  inherit: 'currentColor',
  primary: 'var(--interactive-primary, #3b82f6)',
  secondary: 'var(--text-secondary, #94a3b8)',
  muted: 'var(--text-muted, #64748b)',
  gain: 'var(--domain-gain, #22c55e)',
  loss: 'var(--domain-loss, #ef4444)',
  warning: 'var(--severity-medium, #f59e0b)',
  critical: 'var(--severity-critical, #ef4444)',
};

export function Icon({
  icon: Component,
  size = 'md',
  color = 'inherit',
  className,
  ...props
}: IconProps): ReactElement {
  const pixelSize = typeof size === 'number' ? size : (SIZE_MAP[size] ?? 20);
  const strokeColor = COLOR_MAP[color] ?? 'currentColor';

  return (
    <Component
      width={pixelSize}
      height={pixelSize}
      stroke={strokeColor}
      className={cx(className)}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  );
}
