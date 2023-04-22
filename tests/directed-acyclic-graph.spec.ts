/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DirectedAcyclicGraph, DirectedAcyclicGraphError } from '../post-processed-src/classes';
import { expect } from 'chai';
import 'mocha';

describe('Directed Ayclic Graphs', () => {
  it('should be able to add edges and vertices', () => {
    const dag = new DirectedAcyclicGraph<number>({
      shouldVerifyOnAddingEdge: true
    });

    const dag2 = new DirectedAcyclicGraph<number>({
      shouldVerifyOnAddingEdge: true,
      useWasm: true
    });

    const vertexIndex = dag.addVertex(1);
    const vertexIndex2 = dag.addVertex(1);

    expect(vertexIndex).to.equal(0);
    expect(vertexIndex2).to.equal(0);

    const vertexIndices = dag.addVertices([1, 2, 3, 4]);
    const vertexIndices2 = dag.addVertices([1, 2, 3, 4]);

    expect(vertexIndices[0]).to.equal(0);
    expect(vertexIndices[1]).to.equal(1);
    expect(vertexIndices[2]).to.equal(2);
    expect(vertexIndices[2]).to.equal(3);
    expect(dag.vertices.length).to.equal(4);

    expect(vertexIndices2[0]).to.equal(0);
    expect(vertexIndices2[1]).to.equal(1);
    expect(vertexIndices2[2]).to.equal(2);
    expect(vertexIndices2[2]).to.equal(3);
    expect(dag2.vertices.length).to.equal(4);

    dag.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 1
    });

    dag2.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 1
    });

    expect(dag.edges.length).to.equal(1);
    expect(dag.edges[0]).to.deep.equal([1]);

    expect(dag2.edges.length).to.equal(1);
    expect(dag2.edges[0]).to.deep.equal([1]);

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

    dag2.addEdges([
      {
        fromVertexIndex: 1,
        toVertexIndex: 2
      },
      {
        fromVertexIndex: 1,
        toVertexIndex: 3
      }
    ]);

    expect(dag.edges.length).to.equal(3);
    expect(dag.edges[1]).to.deep.equal([2, 3]);

    expect(dag2.edges.length).to.equal(3);
    expect(dag2.edges[1]).to.deep.equal([2, 3]);

    expect(() => dag.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 0
    })).to.throw(DirectedAcyclicGraphError);

    expect(() => dag.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 1
    })).to.throw(DirectedAcyclicGraphError);

    expect(() => dag2.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 0
    })).to.throw(DirectedAcyclicGraphError);

    expect(() => dag2.addEdge({
      fromVertexIndex: 0,
      toVertexIndex: 1
    })).to.throw(DirectedAcyclicGraphError);
  });

  /*it('should be able to detect cycles', () => {
    const dag = new DirectedAcyclicGraphNative<number>({
      shouldVerifyOnAddingEdge: true
    });
    
    const verrices = dag.addVertices([1, 2, 3, 4]);

  });*/
});
