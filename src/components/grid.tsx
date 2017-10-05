// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import { Component, Props } from 'react';

import { create, IGridCore } from 'grid';

export interface IGridProps extends Props<void> {

}

export interface IGridState { }

export class Grid extends Component<IGridProps, IGridState> {
  grid?: IGridCore;
  gridContainer: HTMLElement;
  reactContainer: HTMLElement | null;
  constructor() {
    super();
    this.gridContainer = document.createElement('div');
  }

  getGridInstance() {
    if (!this.grid) {
      this.grid = create();
    }
  }

  ensureGridContainerInDOM() {
    if (this.reactContainer && this.reactContainer.firstChild !== this.gridContainer) {
      this.reactContainer.appendChild(this.gridContainer);
    }
  }

  componentDidMount() {
    this.ensureGridContainerInDOM();
  }

  componentDidUpdate() {
    this.ensureGridContainerInDOM();
  }

  render() {
    return (
      <div
        ref={(elem) => { this.reactContainer = elem; }}
      >
        Grid
      </div>
    );
  }
}