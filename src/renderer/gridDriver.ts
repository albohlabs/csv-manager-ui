import xs, { Stream } from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import { Model } from './common.internalTypes';
import * as grid from './grid/grid';

export type { GridEvents } from './grid/grid';
export type GridSink = Stream<readonly Model[]>;

export const makeGridDriver = (selector: string) => {
  return (sink$: GridSink) => {
    sink$.take(1).addListener({ next: grid.create(selector) });
    sink$.addListener({
      next: grid.setRowData,
    });

    const change$ = sink$
      .take(1)
      .map(() =>
        xs.create<grid.GridEvents>({
          start: (listener) => {
            grid.onRowDelete((event) => {
              listener.next(event);
            });

            grid.onCellValueChanged((event) => {
              listener.next(event);
            });
          },
          stop: () => {
            // TODO: removeEventListener
          },
        })
      )
      .flatten();

    return adapt(change$);
  };
};
