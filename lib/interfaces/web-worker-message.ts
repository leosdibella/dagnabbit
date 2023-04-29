import { WasmModuleFunctionName } from '../enums';

export interface IWebWorkerMessage {
  edges: number[][];
  code: string;
  wasmModuleFunctionName: WasmModuleFunctionName;
}
