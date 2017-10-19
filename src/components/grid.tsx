// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import { Component, Props } from 'react';

import { create, Grid, IGridDimension } from 'grid';
import { IColDescriptor, IRowColDescriptor, IRowDescriptor } from 'grid/dist/modules/abstract-row-col-model';
import { IGridDataResult, RowLoader } from 'grid/dist/modules/data-model';

export interface IGridProps extends Props<void> {
  rows: Array<Partial<IRowDescriptor>>;
  cols: Array<Partial<IColDescriptor>>;
  data?: Array<Array<IGridDataResult<any>>>;
  loadRows?: RowLoader;
}

export interface IGridState { }

export class ReactGrid extends Component<IGridProps, IGridState> {
  grid: Grid;
  gridContainer: HTMLElement;
  reactContainer: HTMLElement | null;
  rows?: IRowColDescriptor[];
  cols?: IRowColDescriptor[];

  constructor(props: IGridProps) {
    super(props);
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.position = 'absolute';
    this.gridContainer.style.top = '0';
    this.gridContainer.style.left = '0';
    this.gridContainer.style.height = '100%';
    this.gridContainer.style.width = '100%';
    this.grid = create({ loadRows: props.loadRows });
  }

  ensureGridContainerInDOM() {
    if (this.reactContainer && this.reactContainer.firstChild !== this.gridContainer) {
      this.reactContainer.appendChild(this.gridContainer);
    }
  }

  reflectNewRowsOrCols(
    previousDescriptors: IRowColDescriptor[] | undefined,
    nextDescriptors: Array<Partial<IRowColDescriptor>>,
    dim: IGridDimension) {
    if (previousDescriptors) {
      previousDescriptors.forEach((row) => { dim.rowColModel.remove(row); });
    }
    const newRows = nextDescriptors.map((newRow) => {
      const row = dim.rowColModel.create();
      Object.assign(row, newRow);
      return row;
    });
    dim.rowColModel.add(newRows);
    return newRows;
  }

  shouldComponentUpdate(nextProps: IGridProps) {
    if (this.props.rows !== nextProps.rows) {
      this.rows = this.reflectNewRowsOrCols(this.rows, nextProps.rows, this.grid.rows);
    }
    if (this.props.cols !== nextProps.cols) {
      this.cols = this.reflectNewRowsOrCols(this.cols, nextProps.cols, this.grid.cols);
    }

    if (this.props.data !== nextProps.data && nextProps.data) {
      nextProps.data.forEach((row, dataRowIndex) => {
        if (this.rows) {
          this.rows[this.grid.rows.converters.data.toVirtual(dataRowIndex)].data = row;
        }
      });
      this.grid.dataModel.setDirty();
    }
    return false;
  }

  componentDidMount() {
    this.ensureGridContainerInDOM();
    this.grid.build(this.gridContainer);
    this.rows = this.reflectNewRowsOrCols(this.rows, this.props.rows, this.grid.rows);
    this.cols = this.reflectNewRowsOrCols(this.cols, this.props.cols, this.grid.cols);
  }

  // we return false from should update but react may ignore our hint in the future
  componentDidUpdate() {
    this.ensureGridContainerInDOM();
  }

  render() {
    return (
      <div ref={(elem) => { this.reactContainer = elem; }} />
    );
  }
}