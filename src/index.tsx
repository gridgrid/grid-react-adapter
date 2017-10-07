import * as React from 'react';
import { render } from 'react-dom';

import _range = require('lodash/range');

import { ReactGrid } from '@cmpts/index';
const rows = _range(0, 1000).map((_idx) => ({} as any));
const cols = _range(0, 100).map((_idx) => ({} as any));
rows[0].header = true;
rows[0].height = 50;

render(
  <ReactGrid rows={rows} cols={cols} />,
  document.getElementById('app')
);
