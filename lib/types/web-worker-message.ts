import { WebWorkerArguments } from './web-worker-arguments';
import { WebWorkerFunctionDefinition } from './web-worker-function-definition';
import { WebWorkerFunctionName } from './web-worker-function-name';

export type WebWorkerMessage<T extends WebWorkerFunctionName> = {
  webWorkerArguments: WebWorkerArguments<T>;
  webWorkerFunctionDefinition: WebWorkerFunctionDefinition;
  wasmModuleFunctionName: T;
};
