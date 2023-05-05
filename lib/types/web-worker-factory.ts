import { WasmModuleFunctionName } from '../enums';
import { IWebWorkerParameters } from '../interfaces';
import { WebWorkerResponse } from './web-worker-response';

export type WebWorkerFactory = <T extends WasmModuleFunctionName>(
  parameters: IWebWorkerParameters<T>
) => Promise<WebWorkerResponse<T>>;
