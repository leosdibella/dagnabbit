import {
  IDirectedAcyclicGraph,
  IPlatformParameters,
  ITopologicalSortWebWorkerMessage
} from '../interfaces';
import { DirectedAcyclicGraphBase } from '../classes';
import { topologicalSort } from '../assembly/topological-sort.as';
import { instantiateTopologicalSortWasmModule } from '../utilities';

let webWorkerId = BigInt(0);
const webWorkerUrls: Partial<Record<string, string>> = {};
const topologicalSortNativeCode = topologicalSort.toString();
const topologicalSortWasmCode = instantiateTopologicalSortWasmModule.toString();

const webWorkerOptions: WorkerOptions = {
  type: 'classic',
  credentials: 'omit'
};

function nativeWebWorker() {
  self.onmessage = (
    messageEvent: MessageEvent<ITopologicalSortWebWorkerMessage>
  ) => {
    const functionBody = messageEvent.data.topologicalSortNativeCode
      .trim()
      .replace('function topologicalSort(edges) {', '');

    // eslint-disable-next-line no-new-func
    const topologicalSorter = new Function(
      'edges',
      functionBody.slice(0, functionBody.length - 1)
    ) as (edges: number[][]) => number[];

    const topologicallySorted = topologicalSorter(messageEvent.data.edges);

    self.postMessage(topologicallySorted);
  };
}

function wasmWebWorker() {
  self.onmessage = (
    messageEvent: MessageEvent<ITopologicalSortWebWorkerMessage>
  ) => {
    const functionBody = messageEvent.data.topologicalSortWasmCode
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
        messageEvent.data.edges
      );

      self.postMessage(topologicallySorted);
    });
  };
}

async function createTopologicalSortWebWorker(
  edges: number[][],
  useWasm: boolean
) {
  const workerFunction = useWasm ? wasmWebWorker : nativeWebWorker;
  const webWorkerCode = `(${workerFunction.toString().trim()})()`;
  const workerFunctionName = workerFunction.name.replace('#', '');
  let objectUrl: string;

  objectUrl = webWorkerUrls[workerFunctionName] ?? '';

  if (!objectUrl) {
    objectUrl = URL.createObjectURL(
      new Blob([webWorkerCode], {
        type: 'text/javascript'
      })
    );

    webWorkerUrls[workerFunctionName] = objectUrl;
  }

  const workerOptions: WorkerOptions = {
    ...webWorkerOptions,
    name: `DirectedAcyclicGraph-WebWorker-${workerFunctionName}-${++webWorkerId}`
  };

  const webWorker = new Worker(objectUrl, workerOptions);

  const promise = new Promise<number[]>((resolve, reject) => {
    webWorker.onmessage = (messageEvent: MessageEvent<number[]>) => {
      resolve(messageEvent.data);
    };

    webWorker.onerror = (errorEvent: ErrorEvent) => {
      reject(errorEvent.error);
    };
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
