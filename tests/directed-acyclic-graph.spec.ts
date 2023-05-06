/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DirectedAcyclicGraphError } from '../lib/classes';
import { DirectedAcyclicGraph } from '../lib/node';
import { expect } from 'chai';
import 'mocha';

const defaultDagVertices = [0, 1, 2, 3, 4, 5];

const defaultDagEdges: [number, number][] = [
  [0, 2],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 5]
];

const defaultCyclicEdges: [number, number][] = [
  [0, 2],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 5],
  [5, 3]
];

describe('Directed Acyclic Graph', () => {
  it('should be able to use wasm inside of a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultDagEdges
    });

    const topologicallySorted = await dag.topologicalSort(true, true);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to use native code inside of a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultDagEdges
    });

    const topologicallySorted = await dag.topologicalSort(false, true);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to use wasm in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultDagEdges
    });

    const topologicallySorted = await dag.topologicalSort(true, false);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to use native code in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultDagEdges
    });

    const topologicallySorted = await dag.topologicalSort(false, false);

    expect(topologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);
  });

  it('should be able to add edges and vertices', () => {
    const dag = new DirectedAcyclicGraph<number>();
    const vertexIndex = dag.addVertex(0);

    expect(vertexIndex).to.equal(0);

    const vertexIndices = dag.addVertices([1, 2, 3, 4, 5]);

    expect(vertexIndices[0]).to.equal(1);
    expect(vertexIndices[1]).to.equal(2);
    expect(vertexIndices[2]).to.equal(3);
    expect(vertexIndices[3]).to.equal(4);
    expect(vertexIndices[4]).to.equal(5);
    expect(dag.vertices.length).to.equal(6);

    dag.addEdge([0, 2]);

    expect(dag.edges.length).to.equal(1);
    expect(dag.edges[0]).to.deep.equal([0, 2]);

    dag.addEdges([
      [1, 2],
      [2, 3],
      [2, 4],
      [3, 5],
      [4, 5]
    ]);

    expect(dag.edges.length).to.equal(6);
    expect(dag.edges[1]).to.deep.equal([1, 2]);
    expect(dag.edges[2]).to.deep.equal([2, 3]);
    expect(dag.edges[3]).to.deep.equal([2, 4]);
    expect(dag.edges[4]).to.deep.equal([3, 5]);
    expect(dag.edges[5]).to.deep.equal([4, 5]);
  });

  it('should be able to detect cycles, using wasm inside a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultCyclicEdges
    });

    const cycleDetected = await dag.verifyAcyclicity(true, true);

    expect(cycleDetected).to.deep.equal([5, 3]);

    try {
      await dag.topologicalSort(true, true);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });

  it('should be able to detect cycles, using native code inside a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultCyclicEdges
    });

    const cycleDetected = await dag.verifyAcyclicity(false, true);

    expect(cycleDetected).to.deep.equal([5, 3]);

    try {
      await dag.topologicalSort(false, true);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });

  it('should be able to detect cycles, using wasm in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultCyclicEdges
    });

    const cycleDetected = await dag.verifyAcyclicity(true, false);

    expect(cycleDetected).to.deep.equal([5, 3]);

    try {
      await dag.topologicalSort(true, false);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });

  it('should be able to detect cycles, using native code in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      vertices: defaultDagVertices,
      edges: defaultCyclicEdges
    });

    const cycleDetected = await dag.verifyAcyclicity(false, false);

    expect(cycleDetected).to.deep.equal([5, 3]);

    try {
      await dag.topologicalSort(false, false);
    } catch (e: unknown) {
      expect(e instanceof DirectedAcyclicGraphError).to.be.true;
    }
  });
});
