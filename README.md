dagnabbit
===

A library for creating directed acyclic graphs and topologically sorting them, written in TypeScript / AssemblyScript supporing WASM and Web Workers that targets both browsers and node.

Installation
---

```bash
  npm install --save dagnabbit
```

Importing
---

Node

```typescript
import { DirectedAcyclicGraph } from 'dagnabbit/node';
```

Browser

```typescript
import { DirectedAcyclicGraph } from 'dagnabbit/browser';
```

Usage
---

```typescript
  const dag = new DirectedAcyclicGraph<string>([]);
  
  const topologicallySorted = await dag.topologicalSort();
```

Interface
---

```typescript
interface IDirectedAcyclicGraph<T> {
  // A shallow copy of the vertices defined in the graph
  readonly vertices: T[];
  // A deep copy of the edges defined in the graph
  readonly edges: number[][];
  tryAddEdge(edge: [number, number]): boolean;
  // Will throw exceptions for invalid edge deifnitions
  addEdge(edge: [number, number]): void;
  tryAddEdges(edges: [number, number][]): boolean[];
  // Will throw exceptions for invalid edge deifnitions
  addEdges(edges: [number, number][]): void;
  tryRemoveEdge(edge: [number, number]): boolean;
  // Will throw exceptions for invalid edge deifnitions
  removeEdge(edge: [number, number]): void;
  tryRemoveEdges(edges: [number, number][]): boolean[];
  // Will throw exceptions for invalid edge deifnitions
  removeEdges(edges: [number, number][]): void;
  // Method to add a single vertex
  addVertex(value: T): number;
  // Method to add multiple vertices
  addVertices(values: T[]): number[];
  // Method to remove a single vertex
  removeVertex(vertexIndex: number): void;
  // Method to remove multiple vertices
  removeVertices(vertexIndices: number[]): void;
  // Create deep-ish copy of an existing graph
  // The edges are deep copied, the vertices are only shallow copied
  clone(): IDirectedAcyclicGraph<T>;
  // Remove all vertices and edges
  clear(): void;
  /** Sort the DAG topologically,
   * optionally executes via WASM
   * optionally executes via WebWorkers
   * optionally performs an acyclic verification step prior to sorting
   * in which case a will a cycleDetected error if the graph is not acyclic */
  topologicalSort(useWasm?: boolean, useWebWorkers?: boolean, skipVerification?: boolean): Promise<T[]>;
  // Vertify that the DAG is actually acyclic
  // can be checked automatically prior to topologicalSort
  // returns the first cycle found (e.g. [1, 2, 3] => 1 -> 2 -> 3 -> 1)
  // returns an empty array if the graph is a valid DAG
  verifyAcyclicity(useWasm?: boolean, useWebWorkers?: boolean): Promise<T[]>;
}
```

Performance Testing
---

To run performance tests there are a couple of options,

Locally,

1. `npm install`
2. `npm run start:app && npm run start:api`

Docker Compose,

1. `docker compose`

Either option will initialize a web server that serves the front end on `http:localhost:3000` and a backend server which runs on `http:localhost:3001` which can be used to execute performance tests on the front end as well as the backend to compare Node v. Browser performance.

Performance metrics will show execution time comparsions of vertifying acylicity and topologically sorting with a metric for each of the 4 following scenarios, in both the browser and in Node for a total of 8 datapoints.

1. Native JS code running in the main thread
2. WASM code running in the main thread
3. Native JS code running in a Web Worker
4. WASM code running a in a Web Worker

Test runs can be configured as follows,

1. Single runs with a fixed (or random number) of vertices specified that generates a random DAG.
2. Multiple runs with a fixed (or random number) of test cases, each generating a random DAG.
3. An explicity specified DAG entered via user input (or file upload).

Development
---

1. `lib/assmebly` contains the AssemblyScript code that can be compiled into WASM.
    - Run `npm run build:as` to build the release version of the code to the `as-build` directory
    - Note this includes a post build step, which is executed by node via `post-as-build.mjs`. The WASM code is encoded it into a base64 string, then injected as a string string into the associated JS interfacing code that AssemblyScript creates for instantiating the WASM module. This allows the entirety of the build output to be packaged along with the rest of the library and circumvents the need for any library consumers to make additional network requests or worry about any implementation details around how the WASM code is initialized.
2. Run `npm run test`, to execute the unit tests against the node version of the library.
    - Unit tests for the WASM code in isolation.
    - Unit tests for the DAG wrapper that the library consumer interfaces with.
    - Note that running `npm run test` also executes the `build:as` step.
3. Run `npm run lint` to run the eslint configuration against the relevant `.ts` files.
4. Run `npm run prettier:check` to check if all relevant files meet the requirements for prettier.

Building and Publishing
---

1. To build the library run `npm run build:lib`, all relevant code will be placed into `/dist`.
2. Publish via npm.
