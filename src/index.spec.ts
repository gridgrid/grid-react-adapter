import * as tape from 'tape';
import { Test } from 'tape';

let _test = require('tape-promise');
const test = _test(tape); // decorate tape 

test('should be requireable', function (t: Test): void {
  t.ok(require('./'), 'required without error');
  t.end();
});