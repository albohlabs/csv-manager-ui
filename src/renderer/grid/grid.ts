import {
  CellValueChangedEvent,
  Events,
  Grid,
  GridOptions,
} from 'ag-grid-community';
import xs, { Stream } from 'xstream';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/lib/function';
import {
  IDeleteButtonRendererParams,
  DeleteButtonRenderer,
  DeleteEvent,
} from './deleteButtonRenderer';
import { Model } from '../common.internalTypes';

/*
 * @workaround subscribing on the event bus of ag-grid doesn't fit here because _custom events_
 * like `DeleteEvent` (dispatching via `gridOptions.api.dispatchEvent`) can't include a
 * a payload.
 * Also the upper layer attach event listeners in a lazy manner so that some listeners can't be
 * provided when the grid is initialized.
 */
const events$: Stream<DeleteEvent> = xs.create();

const deleteCellRendererParams: IDeleteButtonRendererParams = {
  eventListener: (event) => {
    events$.shamefullySendNext(event);
  },
};

const gridOptions: GridOptions = {
  columnDefs: [
    {
      sortable: false,
      editable: false,
      filter: false,
      cellRenderer: 'deleteButtonRenderer',
      cellRendererParams: deleteCellRendererParams,
    },
    {
      headerName: 'Nummer',
      field: 'number',
    },
    {
      headerName: 'karton',
      field: 'cardboardBox',
    },
    {
      headerName: 'Anzahl',
      field: 'count',
    },
    {
      headerName: 'Tragebild',
      field: 'image',
      filter: true,
    },
    {
      headerName: 'Male,Female',
      field: 'gender',
    },
    {
      headerName: 'Kleidungsstück',
      field: 'clothe',
      floatingFilter: true,
    },
    {
      headerName: 'Titel ETSY',
      field: 'titleEtsy',
      floatingFilter: true,
    },
    {
      headerName: 'Beschreibung',
      field: 'desc',
      floatingFilter: true,
    },
    {
      headerName: 'Marke',
      field: 'brand',
    },
    {
      headerName: 'Fehler',
      field: 'flaws',
    },
    {
      headerName: 'Farbe',
      field: 'color',
      floatingFilter: true,
    },
    {
      headerName: 'Größe',
      field: 'size',
    },
    {
      headerName: 'Tags',
      field: 'tags',
      floatingFilter: true,
    },
    {
      headerName: 'Material',
      field: 'material',
      floatingFilter: true,
    },
    {
      headerName: 'Preis',
      field: 'price',
    },
    {
      headerName: 'Stil',
      field: 'style',
    },
  ],
  defaultColDef: {
    editable: true,
    sortable: true,
    resizable: true,
    filter: true,
  },
  components: {
    deleteButtonRenderer: DeleteButtonRenderer,
  },
};

export const create = (selector: string) => () => {
  pipe(
    O.fromNullable(document.querySelector<HTMLElement>(selector)),
    O.fold(
      () => {
        throw new Error(`No element '${selector}' found`);
      },
      (el) => {
        el.classList.add('ag-theme-alpine');
        void new Grid(el, gridOptions);
      }
    )
  );
};

const autoResize = () => {
  pipe(
    gridOptions.columnApi!.getAllColumns()!.map((column) => column.getColId()),

    (colIds) => {
      gridOptions.columnApi!.autoSizeColumns(colIds);
    }
  );
};

export const setRowData = (data: readonly Model[]) => {
  gridOptions.api!.setRowData(data as Model[]);

  autoResize();
};

export const onCellValueChanged = (
  fn: (event: CellValueChangedEvent) => void
) => {
  gridOptions.api!.addEventListener(Events.EVENT_CELL_VALUE_CHANGED, fn);
};

export const onRowDelete = (fn: (event: DeleteEvent) => void) => {
  events$.addListener({
    next: fn,
  });
};

export type GridEvents = DeleteEvent | CellValueChangedEvent;
