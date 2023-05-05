export function verifyAcyclic(outEdges: u32[][], inEdges: u32[][]): i32 {
  if (outEdges.length === 0) {
    return -1;
  }

  const zeroInEdgeVertices: i32[] = inEdges
    .map<i32>((ie, i) => (ie.length === 0 ? i : -1))
    .filter((ie) => ie > -1);

  const zeroInEdgeVertexCount = zeroInEdgeVertices.length as u32;

  if (zeroInEdgeVertexCount === 0) {
    return 0;
  }

  const stack: u32[][] = new Array<u32[]>(0);

  for (let i: u32 = 0; i < zeroInEdgeVertexCount; ++i) {
    const zeroInEdgeVertex = zeroInEdgeVertices[i];
    const adjacencyEdges = outEdges[zeroInEdgeVertex];
    const adjacencyEdgesCount = adjacencyEdges.length as u32;

    for (let j: u32 = 0; j < adjacencyEdgesCount; ++j) {
      const outEdge = new Array<u32>(2);

      outEdge[0] = zeroInEdgeVertex as u32;
      outEdge[1] = adjacencyEdges[j];

      stack.push(outEdge);
    }
  }

  const visited = outEdges.map(() => false);
  const traversed = new Array<u32>(0);
  let pruneTraversed = false;

  while (stack.length > 0) {
    const outEdge = stack.pop() as u32[];
    const fromVertex = outEdge[0];
    const toVertex = outEdge[1];
    const adjacentEdges = outEdges[toVertex];
    const adjacentEdgesCount = adjacentEdges.length as u32;

    if (pruneTraversed) {
      pruneTraversed = false;

      const traversedCount = traversed.length - 1;

      for (let i: i32 = traversedCount; i >= 0; --i) {
        if (traversed[i] !== fromVertex) {
          traversed.pop();
        } else {
          break;
        }
      }
    } else {
      traversed.push(fromVertex);
    }

    if (traversed.indexOf(toVertex) > -1) {
      return toVertex;
    }

    if (!visited[toVertex]) {
      for (let i: u32 = 0; i < adjacentEdgesCount; ++i) {
        const nextOutEdge = new Array<u32>(2);

        nextOutEdge[0] = toVertex;
        nextOutEdge[1] = adjacentEdges[i];

        stack.push(nextOutEdge);
      }

      visited[toVertex] = true;
    }

    if (adjacentEdgesCount === 0) {
      pruneTraversed = true;
    }
  }

  return -1;
}
