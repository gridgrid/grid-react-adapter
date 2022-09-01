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
  IEditDecorator,
  IGridDataChange,
  IGridDataResult,
  IGridDimension,
  IGridOpts,
  IRowColBuilder,
  IRowColDescriptor,
  IRowDescriptor,
  RowModel,
} from 'grid';

export type ReactRowCol<T extends IRowColDescriptor> = Omit<T, 'editOptions'> &
  Partial<{
    editOptions: Omit<NonNullable<T['editOptions']>, 'getEditor'> & Partial<Pick<NonNullable<T['editOptions']>, 'getEditor'>>;
  }>;
export type ReactRowColDescriptor = ReactRowCol<IRowColDescriptor>;
export type IReactColDescriptor = ReactRowCol<IColDescriptor>;
export type IReactRowDescriptor = ReactRowCol<IRowDescriptor>;
export type GridEditState = { editing: boolean; row: number; col: number; typedText?: string };
export interface IGridProps extends IGridOpts {
  rows: Array<Partial<IReactRowDescriptor>>;
  cols: Array<Partial<IReactColDescriptor>>;
  data?: Array<Array<IGridDataResult<any>>>;
  cellRenderer?(context: IBuilderUpdateContext): ReactElement<any> | string | undefined;
  headerCellRenderer?(context: IBuilderUpdateContext): ReactElement<any> | string | undefined;
  setData?(changes: Array<IGridDataChange<any>>): Array<IGridDataChange<any>> | undefined;
  className?: string;
  setGrid?(grid: Grid): void;
  setEditState?(opts: GridEditState): void;
  editor?: React.ReactElement;
  saveEdit?: () => Promise<IGridDataChange<any> | undefined>;
}

export interface IGridState {
  editState?: GridEditState;
  editorContainer?: HTMLDivElement;
}

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
        ? [
            {
              row: rowOrData,
              col: c as number,
              value: datum,
            },
          ]
        : rowOrData;

      const newChanges = (this.props.setData && this.props.setData(dataChanges)) || dataChanges;
      origSet.call(grid.dataModel, newChanges);
    };
    return grid;
  }
  setEditState = (editState: GridEditState) => {
    this.setState({
      editState: editState,
    });
    this.props.setEditState?.(editState);
  };

  ensureGridContainerInDOM() {
    if (this.grid) {
      return this.grid;
    }
    const grid = this.createGrid();
    if (this.gridContainer.current) {
      grid.build(this.gridContainer.current);
      grid.eventLoop.bind('grid-edit', () => {
        if (!grid.editModel.editing && this.state.editState) {
          this.setEditState({ ...this.state.editState, editing: false, typedText: undefined });
        }
      });
    } else {
      console.error('grid ref didnt exist at mount');
    }
    this.props.setGrid?.(grid);
    return grid;
  }

  createDiscriptors(
    descriptorObjects: Array<Partial<ReactRowColDescriptor>>,
    dim: IGridDimension,
    grid: Grid
  ): { baseDescriptors: IRowColDescriptor[]; needsExpandedDescriptors: IRowColDescriptor[] } {
    const isCol = grid.cols === dim;
    let needsExpandedDescriptors: IRowColDescriptor[] = [];
    const baseDescriptors = descriptorObjects.map((newDescriptor) => {
      const descriptor = dim.rowColModel.create();
      if (newDescriptor.children) {
        const { baseDescriptors: children, needsExpandedDescriptors: childNeedsExpanded } = this.createDiscriptors(
          newDescriptor.children,
          dim,
          grid
        );
        descriptor.children = children;
        needsExpandedDescriptors = [...needsExpandedDescriptors, ...childNeedsExpanded, ...(newDescriptor.expanded ? [descriptor] : [])];
      }
      if (isCol && newDescriptor.editOptions && !newDescriptor.editOptions.getEditor) {
        const editOptions = {
          ...newDescriptor.editOptions,
          getEditor: (row: number) => {
            if (!grid) {
              return {};
            }
            const col = (descriptor.index && dim.converters.virtual.toData(descriptor.index)) || -1;
            const editState = {
              editing: true,
              row,
              col,
            };
            this.setEditState(editState);

            const decorator: IEditDecorator = grid.decorators.create(-1, -1, 50, 150);
            decorator.render = () => {
              const typedText = decorator.typedText?.();
              this.setEditState({ ...editState, typedText });
              if (decorator.boundingBox) {
                decorator.boundingBox.style.zIndex = '100';
              }
              const div = document.createElement('div');
              this.setState({ editorContainer: div });
              div.style.pointerEvents = 'all';

              return div;
            };
            return {
              decorator,
              save: async () => {
                return this.props.saveEdit?.();
              },
              // isInMe: (e) => targetIsElement(e.target) && isWithinElementWithClass(e.target, ['modal-backdrop', 'modal-dialog']),
            };
          },
        };
        descriptor.editOptions = editOptions;
      }
      Object.assign(descriptor, _.omit(newDescriptor, 'children', 'editOptions'));
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

  reflectNewRowsOrCols(nextDescriptors: Array<Partial<ReactRowColDescriptor>>, dim: IGridDimension, grid: Grid) {
    dim.rowColModel.clear(true);
    const { baseDescriptors, needsExpandedDescriptors } = this.createDiscriptors(nextDescriptors, dim, grid);
    const newDescriptors = dim.rowColModel.add(baseDescriptors);
    needsExpandedDescriptors.forEach((d) => (d.expanded = true));
    return newDescriptors;
  }

  descriptorsChanged(d1: Array<Partial<ReactRowColDescriptor>>, d2: Array<Partial<ReactRowColDescriptor>>) {
    return (
      d1.length !== d2.length || // different lengths short cut
      d1.some((descriptor, index) => JSON.stringify(d2[index]) !== JSON.stringify(descriptor))
    );
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
    console.log('mount');
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
    this.reflectNewRowsOrCols(this.props.rows, grid.rows, grid);
    this.reflectNewRowsOrCols(this.props.cols, grid.cols, grid);
    this.handleNewData(this.props.data, grid);
  }

  // we return false from should update but react may ignore our hint in the future
  componentDidUpdate(prevProps: IGridProps) {
    console.log('update');
    const something = 'a string you cant ignore';

    const grid = this.ensureGridContainerInDOM();

    const nextProps = this.props;
    if (this.descriptorsChanged(prevProps.rows, nextProps.rows)) {
      this.reflectNewRowsOrCols(nextProps.rows, grid.rows, grid);
    }
    if (this.descriptorsChanged(prevProps.cols, nextProps.cols)) {
      this.reflectNewRowsOrCols(nextProps.cols, grid.cols, grid);
    }

    if (prevProps.data !== nextProps.data) {
      this.handleNewData(nextProps.data, grid);
    }
  }

  componentWillUnmount() {
    console.log('unmount');
    if (this.grid) {
      this.grid.destroy();
      this.grid.destroyed = true;
      this.grid = undefined;
    }
  }

  render() {
    return (
      <div className={this.props.className}>
        <div ref={this.gridContainer} style={gridStyle} />
        {this.props.editor && this.state.editorContainer && ReactDOM.createPortal(this.props.editor, this.state.editorContainer)}
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
} as const;
