import { applyMiddleware, compose, createStore, Store } from 'redux';
import thunkMiddleware from 'redux-thunk';

const reduxImmutableStateInvariant = require('redux-immutable-state-invariant');

import { rootReducer } from '../state';

let store: Store<any>;

export const getStore = () => {
  if (store) {
    return store;
  } else {
    throw new Error('store has not been created');
  }
};

export const configureStore = async (): Promise<Store<any>> => {
  if (store) {
    return store;
  }

  const win: any = window;
  const mod: any = module;
  let middewares = [
    thunkMiddleware,
  ];
  const dumb = false;
  if (__DEV__ && dumb) {
    // we need to ignore immutabililty checks for applications because it's just too big
    // i think the ignore api below is a newer version of the library so lets remove dumb when we upgrade
    middewares = [
      reduxImmutableStateInvariant({
        ignore: ['applications']
      })
    ].concat(middewares);
  }

  store = createStore(
    rootReducer,
    compose(
      applyMiddleware(...middewares),
      __DEV__ && win.devToolsExtension ? win.devToolsExtension() : (f: any) => f // add support for Redux dev tools
    ) as any
  );

  if (__DEV__ && mod.hot && mod.accept) {
    // Enable Webpack hot module replacement for reducers
    mod.accept('../state', () => {
      const nextReducer = require('../state').rootReducer;
      store.replaceReducer(nextReducer);
    });
  }

  return store;
};