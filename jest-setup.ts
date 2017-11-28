// This file is custom package setup only. This is not the place for global utilities
declare var require: NodeRequire;

import 'raf/polyfill';

import {
  configure
} from 'enzyme';
const Adapter = require('enzyme-adapter-react-16');

configure({
  adapter: new Adapter()
});