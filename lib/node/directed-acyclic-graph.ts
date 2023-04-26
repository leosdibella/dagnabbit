import {
  IDirectedAcyclicGraph,
  IPlatformParameters,
  ITopologicalSortWebWorkerMessage
} from '../interfaces';
import { DirectedAcyclicGraphBase } from '../classes';
import { Worker, WorkerOptions, MessagePort } from 'worker_threads';
import { topologicalSort } from '../assembly/topological-sort.as';
import { instantiateTopologicalSortWasmModule } from '../utilities';

const topologicalSortNativeCode = topologicalSort.toString();
const topologicalSortWasmCode = instantiateTopologicalSortWasmModule.toString();

const webWorkerOptions: WorkerOptions = {
  eval: true
};

function nativeWebWorker() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const parentPort = require('worker_threads').parentPort as MessagePort;

  parentPort.on('message', (message: ITopologicalSortWebWorkerMessage) => {
    const functionBody = message.topologicalSortNativeCode
      .trim()
      .replace('function topologicalSort(edges) {', '');

    // eslint-disable-next-line no-new-func
    const topologicalSorter = new Function(
      'edges',
      functionBody.slice(0, functionBody.length - 1)
    ) as (edges: number[][]) => number[];

    const topologicallySorted = topologicalSorter(message.edges);

    parentPort.postMessage(topologicallySorted);
  });
}

function wasmWebWorker() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const parentPort = require('worker_threads').parentPort as MessagePort;

  parentPort.on('message', (message: ITopologicalSortWebWorkerMessage) => {
    const functionBody = message.topologicalSortWasmCode
      .trim()
      .replace('async function instantiateTopologicalSortWasmModule() {', '');

    // eslint-disable-next-line @typescript-eslint/require-await
    const AsyncFunction = (async (_: unknown) => _).constructor;

    // eslint-disable-next-line new-cap
    const topologicalSorterFactory = AsyncFunction(
      functionBody.slice(0, functionBody.length - 1)
    ) as () => Promise<{
      topologicalSort(edges: number[][]): number[];
    }>;

    topologicalSorterFactory().then((topologicalSortModule) => {
      const topologicallySorted = topologicalSortModule.topologicalSort(
        message.edges
      );

      parentPort.postMessage(topologicallySorted);
    });
  });
}

async function createTopologicalSortWebWorker(
  edges: number[][],
  useWasm: boolean
) {
  const workerFunction = useWasm ? wasmWebWorker : nativeWebWorker;
  const webWorkerCode = `(${workerFunction.toString().trim()})()`;
  const webWorker = new Worker(webWorkerCode, webWorkerOptions);

  const promise = new Promise<number[]>((resolve, reject) => {
    webWorker.on('message', (topologicallySorted: number[]) => {
      resolve(topologicallySorted);
    });

    webWorker.on('error', (error) => {
      reject(error);
    });
  });

  webWorker.postMessage({
    edges,
    topologicalSortNativeCode,
    topologicalSortWasmCode
  } as ITopologicalSortWebWorkerMessage);

  promise.finally(() => {
    webWorker.terminate();
  });

  return promise;
}

export class DirectedAcyclicGraph<T = unknown>
  extends DirectedAcyclicGraphBase<T>
  implements IDirectedAcyclicGraph<T>
{
  public clone() {
    return new DirectedAcyclicGraph(this.vertices, this.edges);
  }

  constructor(vertices?: T[], edges?: number[][]) {
    const platformParameters: IPlatformParameters = {
      supportsWasm: typeof WebAssembly === 'object',
      supportsWebWorkers: typeof Worker === 'function',
      webWorkerTopologicalSort: createTopologicalSortWebWorker
    };

    super(platformParameters, vertices, edges);
  }
}
