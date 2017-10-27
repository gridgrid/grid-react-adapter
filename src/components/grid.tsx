// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import { Component } from 'react';

import { create, Grid, IGridDimension, IGridOpts } from 'grid';
import { IColDescriptor, IRowColDescriptor, IRowDescriptor } from 'grid/dist/modules/abstract-row-col-model';
import { IGridDataResult } from 'grid/dist/modules/data-model';

export interface IGridProps extends IGridOpts {
  rows: Array<Partial<IRowDescriptor>>;
  cols: Array<Partial<IColDescriptor>>;
  data?: Array<Array<IGridDataResult<any>>>;
}

export interface IGridState { }

export class ReactGrid extends Component<IGridProps, IGridState> {
  grid: Grid;
  gridContainer: HTMLElement;
  reactContainer: HTMLElement | null;

  constructor(props: IGridProps) {
    super(props);
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.position = 'absolute';
    this.gridContainer.style.top = '0';
    this.gridContainer.style.left = '0';
    this.gridContainer.style.height = '100%';
    this.gridContainer.style.width = '100%';
    const { rows, cols, data, ...gridOpts } = this.props;
    this.grid = create(gridOpts);
  }

  ensureGridContainerInDOM() {
    if (this.reactContainer && this.reactContainer.firstChild !== this.gridContainer) {
      this.reactContainer.appendChild(this.gridContainer);
    }
  }

  reflectNewRowsOrCols(
    nextDescriptors: Array<Partial<IRowColDescriptor>>,
    dim: IGridDimension
  ) {
    dim.rowColModel.clear(true);
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
      this.reflectNewRowsOrCols(nextProps.rows, this.grid.rows);
    }
    if (this.props.cols !== nextProps.cols) {
      this.reflectNewRowsOrCols(nextProps.cols, this.grid.cols);
    }

    if (this.props.data !== nextProps.data && nextProps.data) {
      nextProps.data.forEach((row, dataRowIndex) => {
        this.grid.rows.converters.data.get(dataRowIndex).data = row;
      });
      this.grid.dataModel.setDirty();
    }
    return false;
  }

  componentDidMount() {
    this.ensureGridContainerInDOM();
    this.grid.build(this.gridContainer);
    this.reflectNewRowsOrCols(this.props.rows, this.grid.rows);
    this.reflectNewRowsOrCols(this.props.cols, this.grid.cols);
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