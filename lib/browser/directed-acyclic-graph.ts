import { IDirectedAcyclicGraph } from 'lib/interfaces';
import { DirectedAcyclicGraphBase } from 'lib/classes';
import { instantiateWasmModule } from 'lib/utilities';
import {
  WebWorkerFunctionName,
  WebWorkerResponse,
  WebWorkerType,
  WebWorkerParameters,
  WebWorkerMessage,
  DirectedAcyclicGraphParameters
} from 'lib/types';

export class DirectedAcyclicGraph<T = unknown>
  extends DirectedAcyclicGraphBase<T>
  implements IDirectedAcyclicGraph<T>
{
  static {
    DirectedAcyclicGraphBase._supportsWasm = typeof WebAssembly === 'object';
    DirectedAcyclicGraphBase._supportsWebWorkers = typeof Worker === 'function';

    DirectedAcyclicGraphBase._webWorkerFactory =
      DirectedAcyclicGraph._createWebWorker;
  }

  private static readonly _webWorkerUrls: Partial<Record<string, string>> = {};

  private static readonly _webWorkerOptions: Readonly<WorkerOptions> = {
    type: 'classic',
    credentials: 'omit'
  };

  private static _webWorkerId = BigInt(0);

  private static _nativeWebWorker<U extends WebWorkerFunctionName>() {
    self.onmessage = (messageEvent: MessageEvent<WebWorkerMessage<U>>) => {
      // eslint-disable-next-line no-new-func
      const nativeFunction = new Function(
        ...messageEvent.data.webWorkerFunctionDefinition.argumentNames,
        messageEvent.data.webWorkerFunctionDefinition.functionBody
      );

      const result = nativeFunction(...messageEvent.data.webWorkerArguments);

      self.postMessage(result);
    };
  }

  private static _wasmWebWorker<U extends WebWorkerFunctionName>() {
    self.onmessage = (messageEvent: MessageEvent<WebWorkerMessage<U>>) => {
      // eslint-disable-next-line @typescript-eslint/require-await
      const AsyncFunction = (async (_: unknown) => _).constructor;

      // eslint-disable-next-line new-cap
      const wasmModuleFactory = AsyncFunction(
        messageEvent.data.webWorkerFunctionDefinition.functionBody
      ) as typeof instantiateWasmModule;

      wasmModuleFactory().then((wasmModule) => {
        const result = (
          wasmModule[messageEvent.data.wasmModuleFunctionName] as (
            ...args: unknown[]
          ) => unknown
        )(...messageEvent.data.webWorkerArguments);

        self.postMessage(result);
      });
    };
  }

  private static async _createWebWorker<U extends WebWorkerFunctionName>(
    parameters: WebWorkerParameters<U>
  ): Promise<WebWorkerResponse<U>> {
    const workerFunction = parameters.useWasm
      ? DirectedAcyclicGraph._wasmWebWorker
      : DirectedAcyclicGraph._nativeWebWorker;

    const webWorkerCode = `(${workerFunction.toString().trim()})()`;
    const webWorkerType: WebWorkerType = parameters.useWasm ? 'wasm' : 'native';
    const webWorkerUrlName = `${parameters.wasmModuleFunctionName}-${webWorkerType}`;

    let webWorkerUrl =
      DirectedAcyclicGraph._webWorkerUrls[webWorkerUrlName] ?? '';

    if (!webWorkerUrl) {
      webWorkerUrl = URL.createObjectURL(
        new Blob([webWorkerCode], {
          type: 'text/javascript'
        })
      );

      DirectedAcyclicGraph._webWorkerUrls[webWorkerUrlName] = webWorkerUrl;
    }

    const workerOptions: WorkerOptions = {
      ...DirectedAcyclicGraph._webWorkerOptions,
      name: `DirectedAcyclicGraph-WebWorker-${webWorkerUrlName}-${++DirectedAcyclicGraph._webWorkerId}`
    };

    const webWorker = new Worker(webWorkerUrl, workerOptions);

    const promise = new Promise<WebWorkerResponse<U>>((resolve, reject) => {
      webWorker.onmessage = (
        messageEvent: MessageEvent<WebWorkerResponse<U>>
      ) => {
        resolve(messageEvent.data);
      };

      webWorker.onerror = (errorEvent: ErrorEvent) => {
        reject(errorEvent.error);
      };
    });

    const webWorkerMessage: WebWorkerMessage<U> = {
      webWorkerArguments: parameters.webWorkerArguments,
      webWorkerFunctionDefinition:
        this._webWorkerFunctionDefinitions[parameters.wasmModuleFunctionName][
          webWorkerType
        ],
      wasmModuleFunctionName: parameters.wasmModuleFunctionName
    };

    webWorker.postMessage(webWorkerMessage);

    promise.finally(() => {
      webWorker.terminate();
    });

    return promise;
  }

  public clone(
    parameters?: Omit<DirectedAcyclicGraphParameters<T>, 'vertices' | 'edges'>
  ) {
    return new DirectedAcyclicGraph({
      ...(parameters ?? {
        vertexCardinalityWasmThreshold: this.vertexCardinalityWasmThreshold,
        vertexCardinalityWebWorkerThreshold:
          this.vertexCardinalityWebWorkerThreshold
      }),
      vertices: this.vertices,
      edges: this.edges
    });
  }
}
