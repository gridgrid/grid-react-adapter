// tslint:disable-next-line:no-unused-variable
import * as _ from 'lodash';
import * as React from 'react';
import { Component, ReactElement } from 'react';
import * as ReactDOM from 'react-dom';

import {
  ColModel,
  create,
  Grid,
  IBuilderUpdateContext,
  IColDescriptor,
  IGridDataChange,
  IGridDataResult,
  IGridDimension,
  IGridOpts,
  IRowColBuilder,
  IRowColDescriptor,
  IRowDescriptor,
  RowModel
} from 'grid';

export interface IGridProps extends IGridOpts {
  rows: Array<Partial<IRowDescriptor>>;
  cols: Array<Partial<IColDescriptor>>;
  data?: Array<Array<IGridDataResult<any>>>;
  cellRenderer?(context: IBuilderUpdateContext): ReactElement<any> | string | undefined;
  headerCellRenderer?(context: IBuilderUpdateContext): ReactElement<any> | string | undefined;
  setData?(changes: Array<IGridDataChange<any>>): Array<IGridDataChange<any>> | undefined;
}

export interface IGridState { }

export class ReactGrid extends Component<IGridProps, IGridState> {
  grid: Grid | undefined;
  cellRendererBuilder: IRowColBuilder | undefined;
  headerCellRendererBuilder: IRowColBuilder | undefined;
  gridContainer: React.RefObject<HTMLDivElement>;

  constructor(props: IGridProps) {
    super(props);
    this.gridContainer = React.createRef();
  }

  private createGrid() {
    const { rows, cols, data, ...gridOpts } = this.props;
    const grid = create(gridOpts);
    this.grid = grid;
    const origSet = grid.dataModel.set;
    grid.dataModel.set = (rowOrData: number | Array<IGridDataChange<any>>, c?: number, datum?: string | string[]) => {
      const dataChanges = !Array.isArray(rowOrData)
        ? [{
          row: rowOrData,
          col: c as number,
          value: datum
        }]
        : rowOrData;

      const newChanges = this.props.setData && this.props.setData(dataChanges) || dataChanges;
      origSet.call(grid.dataModel, newChanges);
    };
    return grid
  }

  ensureGridContainerInDOM() {
    const grid = this.grid || this.createGrid();
    if (this.gridContainer.current) {
      grid.build(this.gridContainer.current);
    } else {
      console.error('grid ref didnt exist at mount')
    }
    return grid;
  }

  createDiscriptors(
    descriptorObjects: Array<Partial<IRowColDescriptor>>,
    dim: IGridDimension,
  ): { baseDescriptors: IRowColDescriptor[], needsExpandedDescriptors: IRowColDescriptor[] } {
    let needsExpandedDescriptors: IRowColDescriptor[] = [];
    const baseDescriptors = descriptorObjects.map((newDescriptor) => {
      const descriptor = dim.rowColModel.create();
      if (newDescriptor.children) {

        const { baseDescriptors: children, needsExpandedDescriptors: childNeedsExpanded } =
          this.createDiscriptors(newDescriptor.children, dim);
        descriptor.children = children;
        needsExpandedDescriptors = [
          ...needsExpandedDescriptors,
          ...childNeedsExpanded,
          ...newDescriptor.expanded ? [descriptor] : [],
        ];
      }
      Object.assign(descriptor, _.omit(newDescriptor, 'children'));
      if ((dim.rowColModel as ColModel).col !== undefined) {
        descriptor.builder = newDescriptor.builder || this.cellRendererBuilder;
      }
      if ((dim.rowColModel as RowModel).row !== undefined && newDescriptor.header) {
        descriptor.builder = newDescriptor.builder || this.headerCellRendererBuilder;
      }
      return descriptor;
    });

    return {
      baseDescriptors,
      needsExpandedDescriptors,
    };
  }

  reflectNewRowsOrCols(
    nextDescriptors: Array<Partial<IRowColDescriptor>>,
    dim: IGridDimension
  ) {
    dim.rowColModel.clear(true);
    const { baseDescriptors, needsExpandedDescriptors } = this.createDiscriptors(nextDescriptors, dim);
    const newDescriptors =
      dim.rowColModel.add(baseDescriptors);
    needsExpandedDescriptors.forEach((d) => d.expanded = true);
    return newDescriptors;
  }

  descriptorsChanged(d1: Array<Partial<IRowColDescriptor>>, d2: Array<Partial<IRowColDescriptor>>) {
    return d1.length !== d2.length || // different lengths short cut
      d1.some((descriptor, index) => JSON.stringify(d2[index]) !== JSON.stringify(descriptor));
  }

  handleNewData(data: Array<Array<IGridDataResult<any>>> | undefined, grid: Grid) {
    if (data) {
      data.forEach((row, dataRowIndex) => {
        grid.rows.converters.data.get(dataRowIndex).data = row;
      });
      grid.dataModel.handleCachedDataChange();
    }
  }

  componentDidMount() {
    console.log('mount')
    const grid = this.ensureGridContainerInDOM();
    this.cellRendererBuilder = grid.colModel.createBuilder(
      () => document.createElement('div'),
      (element, context) => {
        const rendered = this.props.cellRenderer && this.props.cellRenderer(context);
        if (!element || !rendered || typeof rendered === 'string') {
          return undefined;
        }
        ReactDOM.render(rendered, element);
        return element;
      }
    );

    this.headerCellRendererBuilder = grid.rowModel.createBuilder(
      () => document.createElement('div'),
      (element, context) => {
        const { virtualRow } = context;
        if (virtualRow >= grid.rows.rowColModel.numHeaders()) {
          return undefined;
        }
        const rendered = this.props.headerCellRenderer && this.props.headerCellRenderer(context);
        if (!element || !rendered || typeof rendered === 'string') {
          return undefined;
        }
        ReactDOM.render(rendered, element);
        return element;
      }
    );
    this.reflectNewRowsOrCols(this.props.rows, grid.rows);
    this.reflectNewRowsOrCols(this.props.cols, grid.cols);
    this.handleNewData(this.props.data, grid);
  }

  // we return false from should update but react may ignore our hint in the future
  componentDidUpdate(prevProps: IGridProps) {
    console.log('update')
    const something = 'a string you cant ignore';

    const grid = this.ensureGridContainerInDOM();

    const nextProps = this.props;
    if (this.descriptorsChanged(prevProps.rows, nextProps.rows)) {
      this.reflectNewRowsOrCols(nextProps.rows, grid.rows);
    }
    if (this.descriptorsChanged(prevProps.cols, nextProps.cols)) {
      this.reflectNewRowsOrCols(nextProps.cols, grid.cols);
    }

    if (prevProps.data !== nextProps.data) {
      this.handleNewData(nextProps.data, grid);
    }
  }

  componentWillUnmount() {
    console.log('unmount')
    if(this.grid){
      this.grid.destroy();
      this.grid.destroyed = true;
      this.grid = undefined;
    }
  }

  render() {


    return (
      <div>
        <div ref={this.gridContainer} style={gridStyle} />
      </div>
    );
  }
}

const gridStyle = {
  position: 'absolute',
  top: '0',
  left: '0',
  height: '100%',
  width: '100%',
} as const