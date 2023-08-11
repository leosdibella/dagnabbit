import { WebWorkerParameters } from './web-worker-parameters';
import { WebWorkerResponse } from './web-worker-response';
import { WebWorkerFunctionName } from './web-worker-function-name';

export type WebWorkerFactory = <T extends WebWorkerFunctionName>(
  parameters: WebWorkerParameters<T>
) => Promise<WebWorkerResponse<T>>;
