import { ITopologicalSortWebWorkerMessage } from '../interfaces';
import {
  Worker as NodeWebWorker,
  WorkerOptions as NodeWebWorkerOptions,
  parentPort as NodeParentPort
} from 'node:worker_threads';
import { instantiateTopologicalSortWasmModule } from './topological-sort-wasm';
import { topologicalSort } from 'lib/assembly/topological-sort.as';

const webWorkerUrls: Partial<Record<string, string>> = {};
const topologicalSortNativeCode = topologicalSort.toString();
const topologicalSortWasmCode = instantiateTopologicalSortWasmModule.toString();

function getNodeWebWorkerConstructor() {
  if (typeof require === 'undefined') {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('worker_threads').Worker as typeof NodeWebWorker;
}

let webWorkerId = BigInt(0);
const isBrowser = typeof window !== 'undefined';
const NodeWorker = getNodeWebWorkerConstructor();

function nativeWebWorkerNode() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const parentPort = require('worker_threads')
    .parentPort as typeof NodeParentPort;

  parentPort!.on('message', (message: ITopologicalSortWebWorkerMessage) => {
    const functionBody = message.topologicalSortNativeCode
      .trim()
      .replace('function topologicalSort(edges) {', '');

    // eslint-disable-next-line no-new-func
    const topologicalSorter = new Function(
      'edges',
      functionBody.slice(0, functionBody.length - 1)
    ) as (edges: number[][]) => number[];

    const topologicallySorted = topologicalSorter(message.edges);

    parentPort!.postMessage(topologicallySorted);
  });
}

function wasmWebWorkerNode() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const parentPort = require('worker_threads')
    .parentPort as typeof NodeParentPort;

  parentPort!.on('message', (message: ITopologicalSortWebWorkerMessage) => {
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

      parentPort!.postMessage(topologicallySorted);
    });
  });
}

function nativeWebWorkerBrowser() {
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

function wasmWebWorkerBrowser() {
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

const webWorkerOptions = Object.freeze({
  browser: {
    type: 'classic',
    credentials: 'omit'
  } as WorkerOptions,
  node: {
    eval: true
  } as NodeWebWorkerOptions
});

function createTopologicalSortWebWorkerNode(useWasm: boolean) {
  const workerFunction = useWasm ? wasmWebWorkerNode : nativeWebWorkerNode;
  const webWorkerCode = `(${workerFunction.toString().trim()})()`;
  const webWorker = new NodeWebWorker(webWorkerCode, webWorkerOptions.node);

  const promise = new Promise<number[]>((resolve, reject) => {
    webWorker.on('message', (topologicallySorted: number[]) => {
      resolve(topologicallySorted);
    });

    webWorker.on('error', (error) => {
      reject(error);
    });
  });

  return {
    webWorker,
    promise
  };
}

function createTopologicalSortWebWorkerBrowser(useWasm: boolean) {
  const workerFunction = useWasm
    ? wasmWebWorkerBrowser
    : nativeWebWorkerBrowser;

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
    ...webWorkerOptions.browser,
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

  return {
    webWorker,
    promise
  };
}

export const platformSupport = Object.freeze({
  webWorkers: !!(typeof Worker === 'undefined' ? NodeWorker : Worker),
  wasm:
    typeof WebAssembly === 'object' &&
    typeof WebAssembly.instantiate === 'function'
});

export async function topologicallySortInWebWorker(
  edges: number[][],
  useWasm: boolean
) {
  if (!platformSupport.webWorkers) {
    throw new Error('Web Workers are not supported by this platform.');
  }

  if (useWasm && !platformSupport.wasm) {
    throw new Error('WASM is not supported by this platform.');
  }

  const { webWorker, promise } = isBrowser
    ? createTopologicalSortWebWorkerBrowser(useWasm)
    : createTopologicalSortWebWorkerNode(useWasm);

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
