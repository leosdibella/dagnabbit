import { WebWorkerArguments } from '../types';
import { WasmModuleFunctionName } from '../enums';

export interface IWebWorkerParameters<T extends WasmModuleFunctionName> {
  wasmModuleFunctionName: T;
  useWasm: boolean;
  webWorkerArguments: WebWorkerArguments<T>;
}
