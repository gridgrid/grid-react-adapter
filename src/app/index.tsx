import * as React from 'react';
import { render } from 'react-dom';

import _range = require('lodash/range');

require('grid/src/scss/grid.scss');

import { ReactGrid } from '../lib/components';
const rows = _range(0, 1000).map((_idx) => ({
  data: _range(0, 100).map((colIdx) => ({ formatted: `${_idx}, ${colIdx}` }))
} as any));
const cols = _range(0, 100).map((_idx) => ({} as any));
rows[0].header = true;
rows[0].height = 50;

const renderer = (row: number, col: number, data: { formatted: string }) => {
  if (col % 2) {
    return <b>{data.formatted}</b>;
  }
  if (col === 0) {
    return <a>{data.formatted}</a>;
  }
  return data.formatted;
};

render(
  <ReactGrid rows={rows} cols={cols} cellRenderer={renderer} />,
  document.getElementById('app')
);
