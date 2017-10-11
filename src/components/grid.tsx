// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import { Component, Props } from 'react';

import { create, Grid, IGridDimension } from 'grid';
import { IColDescriptor, IRowColDescriptor, IRowDescriptor } from 'grid/dist/modules/abstract-row-col-model';

export interface IGridProps extends Props<void> {
  rows: Array<Partial<IRowDescriptor>>;
  cols: Array<Partial<IColDescriptor>>;
}

export interface IGridState { }

export class ReactGrid extends Component<IGridProps, IGridState> {
  grid: Grid;
  gridContainer: HTMLElement;
  reactContainer: HTMLElement | null;
  rows?: IRowColDescriptor[];
  cols?: IRowColDescriptor[];
  constructor() {
    super();
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.position = 'absolute';
    this.gridContainer.style.top = '0';
    this.gridContainer.style.left = '0';
    this.gridContainer.style.height = '100%';
    this.gridContainer.style.width = '100%';
    this.grid = create();
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
    dim.rowColModel.add(nextDescriptors.map((newRow) => {
      const row = dim.rowColModel.create();
      Object.assign(row, newRow);
      return row;
    }));
  }

  shouldComponentUpdate(nextProps: IGridProps) {
    if (this.props.rows !== nextProps.rows) {
      this.reflectNewRowsOrCols(this.rows, nextProps.rows, this.grid.rows);
    }
    if (this.props.cols !== nextProps.cols) {
      this.reflectNewRowsOrCols(this.cols, nextProps.cols, this.grid.cols);
    }
    return false;
  }

  componentDidMount() {
    this.ensureGridContainerInDOM();
    this.grid.build(this.gridContainer);
    this.reflectNewRowsOrCols(this.rows, this.props.rows, this.grid.rows);
    this.reflectNewRowsOrCols(this.cols, this.props.cols, this.grid.cols);
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