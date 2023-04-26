/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DirectedAcyclicGraphError } from '../lib/classes';
import { DirectedAcyclicGraph } from '../lib/node';
import { expect } from 'chai';
import 'mocha';

describe('Directed Ayclic Graph', () => {
  it('should be able to use wasm inside of a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>();

    dag.addVertices([1, 2, 3, 4, 5, 6]);

    dag.addEdges([
      {
        fromVertexIndex: 0,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 1,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 3
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 4
      },
      {
        fromVertexIndex: 3,
        toVertexIndex: 5
      },
      {
        fromVertexIndex: 4,
        toVertexIndex: 5
      }
    ]);

    const topologicallySorted = await dag.topologicalSort();

    expect(topologicallySorted).to.deep.equal([
      2,
      1,
      3,
      5,
      4,
      6
    ]);
  });

  it('should be able to use native code inside of a web worker', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      shouldVerifyOnAddingEdge: true,
      useWebWorkers: true,
      allowGracefulFallback: false
    });
    
    dag.addVertices([1, 2, 3, 4, 5, 6]);

    dag.addEdges([
      {
        fromVertexIndex: 0,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 1,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 3
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 4
      },
      {
        fromVertexIndex: 3,
        toVertexIndex: 5
      },
      {
        fromVertexIndex: 4,
        toVertexIndex: 5
      }
    ]);

    const topologicallySorted = await dag.topologicalSort();

    expect(topologicallySorted).to.deep.equal([
      2,
      1,
      3,
      5,
      4,
      6
    ]);
  });

  it('should be able to use wasm in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      shouldVerifyOnAddingEdge: true,
      useWasm: true,
      allowGracefulFallback: false
    });
    
    dag.addVertices([1, 2, 3, 4, 5, 6]);

    dag.addEdges([
      {
        fromVertexIndex: 0,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 1,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 3
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 4
      },
      {
        fromVertexIndex: 3,
        toVertexIndex: 5
      },
      {
        fromVertexIndex: 4,
        toVertexIndex: 5
      }
    ]);

    const topologicallySorted = await dag.topologicalSort();

    expect(topologicallySorted).to.deep.equal([
      2,
      1,
      3,
      5,
      4,
      6
    ]);
  });

  it('should be able to use native code in the main thread', async () => {
    const dag = new DirectedAcyclicGraph<number>({
      shouldVerifyOnAddingEdge: true
    });
    
    dag.addVertices([1, 2, 3, 4, 5, 6]);

    dag.addEdges([
      {
        fromVertexIndex: 0,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 1,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 3
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 4
      },
      {
        fromVertexIndex: 3,
        toVertexIndex: 5
      },
      {
        fromVertexIndex: 4,
        toVertexIndex: 5
      }
    ]);

    const topologicallySorted = await dag.topologicalSort();

    expect(topologicallySorted).to.deep.equal([
      2,
      1,
      3,
      5,
      4,
      6
    ]);
  });

  it('should be able to add edges and vertices', () => {
    const dag = new DirectedAcyclicGraph<number>({
      shouldVerifyOnAddingEdge: true
    });

    const vertexIndex = dag.addVertex(1);

    expect(vertexIndex).to.equal(0);

    const vertexIndices = dag.addVertices([1, 2, 3, 4]);

    expect(vertexIndices[0]).to.equal(0);
    expect(vertexIndices[1]).to.equal(1);
    expect(vertexIndices[2]).to.equal(2);
    expect(vertexIndices[3]).to.equal(3);
    expect(dag.vertices.length).to.equal(4);

    dag.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 1
    });

    expect(dag.edges.length).to.equal(4);
    expect(dag.edges[0]).to.deep.equal([1]);

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

    expect(dag.edges.length).to.equal(4);
    expect(dag.edges[1]).to.deep.equal([2, 3]);

    expect(() => dag.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 0
    })).to.throw(DirectedAcyclicGraphError);

    expect(() => dag.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 1
    })).to.throw(DirectedAcyclicGraphError);
  });

  it('should be able to detect cycles', () => {
    const dag = new DirectedAcyclicGraph<number>({
      shouldVerifyOnAddingEdge: true
    });
    
    dag.addVertices([0, 1, 2, 3, 4]);

    dag.addEdges([
      {
        fromVertexIndex: 0,
        toVertexIndex: 1
      },
      {
        fromVertexIndex: 1,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 3
      },
      {
        fromVertexIndex: 3,
        toVertexIndex: 4
      },
      {
        fromVertexIndex: 2,
        toVertexIndex: 4
      }
    ]);

    expect(() => dag.addEdge({
      fromVertexIndex: 3,
      toVertexIndex: 0
    })).to.throw(DirectedAcyclicGraphError);

    expect(() => dag.addEdge({
      fromVertexIndex: 4,
      toVertexIndex: 3
    })).to.throw(DirectedAcyclicGraphError);
  });
});
