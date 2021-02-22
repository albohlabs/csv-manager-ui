import Grid from 'tui-grid';
import { OptRow } from 'tui-grid/types/options';
import xs, { Stream } from 'xstream';
import { adapt } from '@cycle/run/lib/adapt';
import delay from 'xstream/extra/delay';

let instance: Grid;

const createTuiGrid = (selector: string) => () => {
  const el = document.querySelector(selector);
  if (!el) {
    throw new Error(`No element '${selector}' found`);
  }

  instance = new Grid({
    el: el as HTMLElement,
    bodyHeight: 'fitToParent',
    pageOptions: {
      useClient: true,
      perPage: 50,
      type: 'scroll',
    },
    columns: [
      {
        header: 'Name',
        name: 'itemSerialNumber',
        editor: 'text',
      },
      {
        header: 'Artist',
        name: 'itemCompanyName',
        editor: 'text',
      },
      {
        header: 'Type',
        name: 'itemEmployeeMarkme',
        editor: 'text',
      },
      {
        header: 'Release',
        name: 'itemDescription',
        editor: 'text',
      },
      {
        header: 'Genre',
        name: 'itemLeave',
        editor: 'text',
      },
    ],
  });
};

export const makeTuiGridDriver = (selector: string) => {
  return (sink$: Stream<any>) => {
    sink$.take(1).addListener({ next: createTuiGrid(selector) });
    sink$.addListener({
      next: (data: OptRow[]) => {
        instance.resetData(data);
      },
    });

    const change$ = sink$
      .take(1)
      // ensure `instance` is created
      .compose(delay(250))
      .map(() =>
        xs.create({
          start: (listener) => {
            instance.on('afterChange', (event) => {
              listener.next(['afterChange', event]);
            });
          },
          stop: () => {
            instance.off('afterChange');
          },
        })
      )
      .flatten();

    return { change: adapt(change$) };
  };
};
