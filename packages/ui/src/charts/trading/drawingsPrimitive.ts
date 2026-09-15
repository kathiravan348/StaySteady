import type {
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  Time,
} from 'lightweight-charts';

import { toLibraryTime } from './chartTime';
import type { ChartAnchor, TradingDrawing } from './types';

// Draws trend lines, rectangles and text notes on the price pane (UI spec 7.4 drawing tools).
// Horizontal levels are price lines owned by the chart, so they are skipped here.

type DrawTarget = Parameters<IPrimitivePaneRenderer['draw']>[0];

export interface DrawingStyle {
  readonly stroke: string;
  readonly fill: string;
  readonly text: string;
  readonly font: string;
}

interface CanvasPoint {
  readonly x: number;
  readonly y: number;
}

export class DrawingsPrimitive implements ISeriesPrimitive<Time> {
  private params: SeriesAttachedParameter<Time> | null = null;
  private drawings: readonly TradingDrawing[] = [];
  private pending: ChartAnchor | null = null;
  private style: DrawingStyle;
  private readonly view: IPrimitivePaneView;

  constructor(style: DrawingStyle) {
    this.style = style;
    const renderer: IPrimitivePaneRenderer = {
      draw: (target) => {
        this.draw(target);
      },
    };
    this.view = { zOrder: () => 'top', renderer: () => renderer };
  }

  attached(params: SeriesAttachedParameter<Time>): void {
    this.params = params;
  }

  detached(): void {
    this.params = null;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this.view];
  }

  update(
    drawings: readonly TradingDrawing[],
    pending: ChartAnchor | null,
    style: DrawingStyle,
  ): void {
    this.drawings = drawings;
    this.pending = pending;
    this.style = style;
    this.params?.requestUpdate();
  }

  private toPoint(anchor: ChartAnchor): CanvasPoint | null {
    if (this.params === null) {
      return null;
    }
    const x = this.params.chart.timeScale().timeToCoordinate(toLibraryTime(anchor.time));
    const y = this.params.series.priceToCoordinate(anchor.price);
    return x === null || y === null ? null : { x, y };
  }

  private draw(target: DrawTarget): void {
    target.useMediaCoordinateSpace(({ context }) => {
      context.save();
      context.lineWidth = 1.5;
      context.strokeStyle = this.style.stroke;
      context.font = this.style.font;
      this.drawings.forEach((drawing) => {
        this.drawOne(context, drawing);
      });
      const pendingPoint = this.pending === null ? null : this.toPoint(this.pending);
      if (pendingPoint !== null) {
        context.beginPath();
        context.arc(pendingPoint.x, pendingPoint.y, 4, 0, Math.PI * 2);
        context.stroke();
      }
      context.restore();
    });
  }

  private drawOne(context: CanvasRenderingContext2D, drawing: TradingDrawing): void {
    switch (drawing.kind) {
      case 'trend': {
        const from = this.toPoint(drawing.from);
        const to = this.toPoint(drawing.to);
        if (from === null || to === null) return;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        return;
      }
      case 'rectangle': {
        const from = this.toPoint(drawing.from);
        const to = this.toPoint(drawing.to);
        if (from === null || to === null) return;
        const left = Math.min(from.x, to.x);
        const top = Math.min(from.y, to.y);
        const width = Math.abs(to.x - from.x);
        const height = Math.abs(to.y - from.y);
        context.fillStyle = this.style.fill;
        context.fillRect(left, top, width, height);
        context.strokeRect(left, top, width, height);
        return;
      }
      case 'text': {
        const point = this.toPoint(drawing.at);
        if (point === null) return;
        context.fillStyle = this.style.text;
        context.beginPath();
        context.arc(point.x, point.y, 3, 0, Math.PI * 2);
        context.fill();
        context.fillText(drawing.text, point.x + 6, point.y - 6);
        return;
      }
      case 'horizontal':
        return;
    }
  }
}
