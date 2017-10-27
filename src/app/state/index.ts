import { Dispatch } from 'redux';

import { create, createApplicationThunks, IApi, IBasicApplication } from '@creditiq/console-state';

export const api: IApi = create(__MOCK_DATA__);

export const thunks = createApplicationThunks(api);

export { rootSelectors } from '@creditiq/console-state';

export { rootReducer } from '@creditiq/console-state';