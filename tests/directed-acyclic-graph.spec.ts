/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DirectedAcyclicGraphError } from '../lib/classes';
import { DirectedAcyclicGraph } from '../lib/node';
import { expect } from 'chai';
import 'mocha';

describe('Directed Acyclic Graph', () => {
  it('should be able to use wasm inside of a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], []]
    );

    const topologicallySorted = await dag.topologicalSort(true, true);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to use native code inside of a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], []]
    );

    const topologicallySorted = await dag.topologicalSort(false, true);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to use wasm in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], []]
    );

    const topologicallySorted = await dag.topologicalSort(true, false);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to use native code in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], []]
    );

    const topologicallySorted = await dag.topologicalSort(false, false);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to add edges and vertices', () => {
    const dag = new DirectedAcyclicGraph<number>();
    const vertexIndex = dag.addVertex(0);

    expect(vertexIndex).to.equal(0);

    const vertexIndices = dag.addVertices([1, 2, 3, 4]);

    expect(vertexIndices[0]).to.equal(1);
    expect(vertexIndices[1]).to.equal(2);
    expect(vertexIndices[2]).to.equal(3);
    expect(vertexIndices[3]).to.equal(4);
    expect(dag.vertices.length).to.equal(5);

    dag.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 1
    });

    expect(dag.outEdges.length).to.equal(5);
    expect(dag.outEdges[0]).to.deep.equal([1]);

    dag.addEdges([
      {
        fromVertexIndex: 1,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 1,
        toVertexIndex: 3
      }
    ]);

    expect(dag.outEdges.length).to.equal(5);
    expect(dag.outEdges[1]).to.deep.equal([2, 3]);
  });

  it('should be able to verify if a graph has cycles or not, using wasm inside a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    const cycleVertexIndex = await dag.verifyAcyclic(true, true);

    expect(cycleVertexIndex).to.equal(5);
  });

  it('should be able to verify if a graph has cycles or not, using native code inside a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    const cycleVertexIndex = await dag.verifyAcyclic(false, true);

    expect(cycleVertexIndex).to.equal(5);
  });

  it('should be able to verify if a graph has cycles or not, using wasm in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    const cycleVertexIndex = await dag.verifyAcyclic(true, false);

    expect(cycleVertexIndex).to.equal(5);
  });

  it('should be able to verify if a graph has cycles or not, using native code in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    const cycleVertexIndex = await dag.verifyAcyclic(false, false);

    expect(cycleVertexIndex).to.equal(5);
  });

  it('should be able to detect cycles using wasm inside of a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    try {
      await dag.topologicalSort(true, true);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });

  it('should be able to detect cycles using wasm in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    try {
      await dag.topologicalSort(true, false);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });

  it('should be able to detect cycles using native code in a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    try {
      await dag.topologicalSort(false, true);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });

  it('should be able to detect cycles using native code in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>(
      [0, 1, 2, 3, 4, 5],
      [[2], [2], [3, 4], [5], [5], [3]]
    );

    try {
      await dag.topologicalSort(false, false);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });
});
