import {
  CellValueChangedEvent,
  ICellRendererComp,
  ICellRendererParams,
} from 'ag-grid-community';

export type DeleteEvent = Pick<
  CellValueChangedEvent,
  | 'type'
  | 'rowIndex'
  | 'column'
  | 'api'
  | 'columnApi'
  | 'colDef'
  | 'context'
  | 'data'
  | 'node'
>;

export interface IDeleteButtonRendererParams {
  eventListener: (event: DeleteEvent) => void;
}

export class DeleteButtonRenderer implements ICellRendererComp {
  eGui!: HTMLElement;
  eHTMLNode!: HTMLElement;
  eventListener!: () => void;

  init(params: ICellRendererParams & IDeleteButtonRendererParams) {
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = `
      <a class="grid-action-delete">❌</button>
    `;

    this.eHTMLNode = this.eGui.querySelector<HTMLElement>(
      '.grid-action-delete'
    )!;

    this.eventListener = () => {
      const event: DeleteEvent = {
        type: 'deleteCellEvent',
        rowIndex: params.rowIndex,
        column: params.column,
        api: params.api,
        columnApi: params.columnApi,
        colDef: params.colDef,
        context: params.context,
        data: params.node.data,
        node: params.node,
      };
      params.eventListener(event);
    };

    this.eHTMLNode.addEventListener('click', this.eventListener);
  }

  getGui() {
    return this.eGui;
  }

  refresh() {
    return true;
  }

  destroy() {
    if (this.eHTMLNode) {
      this.eHTMLNode.removeEventListener('click', this.eventListener);
    }
  }
}
