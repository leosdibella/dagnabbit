import { WebWorkerArguments } from './web-worker-arguments';
import { WebWorkerFunctionName } from './web-worker-function-name';

export type WebWorkerParameters<T extends WebWorkerFunctionName> = {
  wasmModuleFunctionName: T;
  useWasm: boolean;
  webWorkerArguments: WebWorkerArguments<T>;
};
