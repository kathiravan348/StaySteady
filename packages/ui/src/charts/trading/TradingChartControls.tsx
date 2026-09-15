import type { ReactElement } from 'react';

import { Button } from '../../primitives/Button/Button';
import styles from './TradingChart.module.scss';
import type { TradingChartApi } from './useTradingChart';

export interface TradingChartControlsProps {
  readonly api: TradingChartApi;
  readonly fileName: string;
}

const PAN_BARS = 20;

// Visible controls for zoom, pan, reset and image export (UI spec 8.3), usable without a mouse.
export function TradingChartControls({ api, fileName }: TradingChartControlsProps): ReactElement {
  const saveImage = (): void => {
    const canvas = api.screenshot();
    if (canvas === null) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${fileName}.png`;
    link.click();
  };

  return (
    <div className={styles.controls} role="toolbar" aria-label="Chart view controls">
      <Button size="sm" variant="ghost" aria-label="Zoom in" onPress={() => api.zoom(0.7)}>
        +
      </Button>
      <Button size="sm" variant="ghost" aria-label="Zoom out" onPress={() => api.zoom(1.4)}>
        −
      </Button>
      <Button size="sm" variant="ghost" aria-label="Scroll back" onPress={() => api.pan(-PAN_BARS)}>
        ←
      </Button>
      <Button
        size="sm"
        variant="ghost"
        aria-label="Scroll forward"
        onPress={() => api.pan(PAN_BARS)}
      >
        →
      </Button>
      <Button size="sm" variant="ghost" onPress={api.resetView}>
        Reset view
      </Button>
      <Button size="sm" variant="ghost" onPress={saveImage}>
        Save image
      </Button>
    </div>
  );
}
