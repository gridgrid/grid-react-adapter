// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import { Component, ReactElement } from 'react';
import * as ReactDOM from 'react-dom';

import {
  create,
  Grid,
  IColDescriptor,
  IGridDataResult,
  IGridDimension,
  IGridOpts,
  IRowColBuilder,
  IRowColDescriptor,
  IRowDescriptor
} from 'grid';

export interface IGridProps extends IGridOpts {
  rows: Array<Partial<IRowDescriptor>>;
  cols: Array<Partial<IColDescriptor>>;
  data?: Array<Array<IGridDataResult<any>>>;
  cellRenderer?(virtualRow: number, virtualCol: number, data: IGridDataResult<any>): ReactElement<any> | string;
}

export interface IGridState { }

export class ReactGrid extends Component<IGridProps, IGridState> {
  grid: Grid;
  cellRendererBuilder: IRowColBuilder | undefined;
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
    dim: IGridDimension,
    isCols: boolean
  ) {
    dim.rowColModel.clear(true);
    const newDescriptors = nextDescriptors.map((newDescriptor) => {
      const descriptor = dim.rowColModel.create();
      Object.assign(descriptor, newDescriptor);
      if (isCols) {
        descriptor.builder = newDescriptor.builder || this.cellRendererBuilder;
      }
      return descriptor;
    });
    dim.rowColModel.add(newDescriptors);
    return newDescriptors;
  }

  descriptorsChanged(d1: Array<Partial<IRowColDescriptor>>, d2: Array<Partial<IRowColDescriptor>>) {
    return d1.length !== d2.length || // different lengths short cut
      d1.some((descriptor, index) => JSON.stringify(d2[index]) !== JSON.stringify(descriptor));
  }

  handleNewData(data: Array<Array<IGridDataResult<any>>> | undefined) {
    if (data) {
      data.forEach((row, dataRowIndex) => {
        this.grid.rows.converters.data.get(dataRowIndex).data = row;
      });
      this.grid.dataModel.setDirty();
    }
  }

  shouldComponentUpdate(nextProps: IGridProps) {
    if (this.descriptorsChanged(this.props.rows, nextProps.rows)) {
      this.reflectNewRowsOrCols(nextProps.rows, this.grid.rows, false);
    }
    if (this.descriptorsChanged(this.props.cols, nextProps.cols)) {
      this.reflectNewRowsOrCols(nextProps.cols, this.grid.cols, true);
    }

    if (this.props.data !== nextProps.data) {
      this.handleNewData(nextProps.data);
    }
    return false;
  }

  componentDidMount() {
    this.ensureGridContainerInDOM();
    this.grid.build(this.gridContainer);
    this.cellRendererBuilder = this.grid.colModel.createBuilder(
      () => document.createElement('div'),
      (element, { data, virtualCol, virtualRow }) => {
        const rendered = this.props.cellRenderer && this.props.cellRenderer(virtualRow, virtualCol, data);
        if (!element || !rendered || typeof rendered === 'string') {
          return undefined;
        }
        ReactDOM.render(rendered, element);
        return element;
      }
    );
    this.reflectNewRowsOrCols(this.props.rows, this.grid.rows, false);
    this.reflectNewRowsOrCols(this.props.cols, this.grid.cols, true);
    this.handleNewData(this.props.data);
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