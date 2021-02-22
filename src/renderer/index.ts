import { run } from '@cycle/run';
import { div, input, makeDOMDriver, MainDOMSource, VNode } from '@cycle/dom';
import { Stream } from 'xstream';
import debounce from 'xstream/extra/debounce';
import * as ipc from './ipc.adapter';
import { makeTuiGridDriver } from './tuiGridDriver';
import { Model } from './common.internalTypes';

import './style';

type Sources = {
  DOM: MainDOMSource;
  Grid: {
    change: Stream<unknown>;
  };
};

type Sinks = {
  DOM: Stream<VNode>;
  Grid: Stream<readonly Model[]>;
};

function main(sources: Sources): Sinks {
  const changeValue$ = sources.DOM.select('.searchterm')
    .events('input')
    .map((e): string => (e.target as HTMLInputElement).value);

  changeValue$.compose(debounce(60)).addListener({
    next: (value) => {
      ipc.send(value);
    },
  });

  sources.Grid.change.addListener({
    next: (value) => {
      console.log(value);
    },
  });

  ipc.error$.addListener({
    next: (error) => {
      console.error(error);
    },
  });

  const vdom$ = changeValue$.startWith('').map(() =>
    div([
      input('.searchterm', {
        attrs: { type: 'text', placeholder: 'Suche' },
      }),
      div('.grid'),
    ])
  );

  return { DOM: vdom$, Grid: ipc.data$ };
}

run(main, {
  DOM: makeDOMDriver('body'),
  Grid: makeTuiGridDriver('.grid'),
});
