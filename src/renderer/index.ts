import { run } from '@cycle/run';
import { div, input, makeDOMDriver, MainDOMSource, VNode } from '@cycle/dom';
import { Stream } from 'xstream';
import debounce from 'xstream/extra/debounce';
import * as ipc from './ipc.adapter';

import './style.css';

type Sources = {
  DOM: MainDOMSource;
};

type Sinks = {
  DOM: Stream<VNode>;
};

function main(sources: Sources): Sinks {
  const input$ = sources.DOM.select('.searchterm').events('input');
  const searchterm$ = input$.map(
    (e): string => (e.target as HTMLInputElement).value
  );

  searchterm$.compose(debounce(60)).subscribe({
    next: (value) => {
      console.log('in', value);
      ipc.send(value);
    },
  });

  ipc.error$.subscribe({
    next: (error) => {
      console.error(error);
    },
  });

  const vdom$ = ipc.data$.startWith([]).map((data) =>
    div([
      input('.searchterm.border-b.w-screen.py-2.px-6.mb-3.h-10.text-sm', {
        attrs: { type: 'text', placeholder: 'Suche' },
      }),
      div(
        '.mx-2',
        div(
          '.grid.grid-rows-5.grid-cols-5.gap-2.text-sm',
          data
            .slice(0, 50)
            .flatMap((item) => [
              item.itemSerialNumber,
              item.itemCompanyName,
              item.itemDescription,
              item.itemEmployeeMarkme,
              item.itemLeave,
            ])
            .map((field) =>
              div('.hover:bg-purple-100.hover:text-purple-400', field)
            )
        )
      ),
    ])
  );

  return { DOM: vdom$ };
}

run(main, { DOM: makeDOMDriver('#app') });
