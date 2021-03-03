import { run } from '@cycle/run';
import { div, input, makeDOMDriver, MainDOMSource, VNode } from '@cycle/dom';
import { Stream } from 'xstream';
import debounce from 'xstream/extra/debounce';
import * as ipc from './ipc.adapter';
import { GridEvents, GridSink, makeGridDriver } from './gridDriver';

import './style';

type Sources = {
  DOM: MainDOMSource;
  Grid: Stream<GridEvents>;
};

type Sinks = {
  DOM: Stream<VNode>;
  Grid: GridSink;
};

function main(sources: Sources): Sinks {
  const input$ = sources.DOM.select('.searchterm');

  const changeValue$ = input$
    .events('input')
    .map((e): string => (e.target as HTMLInputElement).value);

  input$
    .element()
    .take(1)
    .addListener({
      next: (el) => {
        (el as HTMLElement).focus();
      },
    });

  changeValue$.compose(debounce(250)).addListener({
    next: (value) => {
      ipc.send(value);
    },
  });

  sources.Grid.addListener({
    next: (event) => {
      console.log(event.type, event);
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
        attrs: { type: 'text', placeholder: '‍🔍 Suche', tabindex: 0 },
      }),
      div('.grid'),
    ])
  );

  return {
    DOM: vdom$,
    Grid: ipc.data$,
  };
}

run(main, {
  DOM: makeDOMDriver('body'),
  Grid: makeGridDriver('.grid'),
});
