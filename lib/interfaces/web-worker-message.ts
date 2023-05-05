import { WebWorkerArguments } from 'lib/types';
import { WasmModuleFunctionName } from '../enums';
import { IWebWorkerFunctionDefinition } from './web-worker-function-definition';

export interface IWebWorkerMessage<T extends WasmModuleFunctionName> {
  webWorkerArguments: WebWorkerArguments<T>;
  webWorkerFunctionDefinition: IWebWorkerFunctionDefinition;
  wasmModuleFunctionName: WasmModuleFunctionName;
}
