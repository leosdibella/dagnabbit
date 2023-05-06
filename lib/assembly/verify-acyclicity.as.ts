export function verifyAcyclicity(outEdges: i32[][], inEdges: i32[][]): i32[] {
  if (outEdges.length === 0) {
    return [];
  }

  const zeroInEdgeVertices: i32[] = inEdges
    .map<i32>((ie, i) => (ie.length === 0 ? i : -1))
    .filter((ie) => ie > -1);

  const visited = outEdges.map(() => false);
  const traversed = new Array<i32>(0);

  if (zeroInEdgeVertices.length === 0) {
    const cyclicStack = new Array<i32>(0);

    cyclicStack.push(0);

    while (cyclicStack.length > 0) {
      const toVertex = cyclicStack.pop() as i32;
      const traversedToVertexIndex = traversed.indexOf(toVertex);

      if (traversedToVertexIndex > -1) {
        return traversed.slice(traversedToVertexIndex - 1);
      }

      if (!visited[toVertex]) {
        const adjacentEdges = outEdges[toVertex];

        for (let i: i32 = 0; i < adjacentEdges.length; ++i) {
          cyclicStack.push(adjacentEdges[i]);
        }
      }
    }
  }

  const stack: i32[][] = new Array<i32[]>(0);

  for (let i: i32 = 0; i < zeroInEdgeVertices.length; ++i) {
    const zeroInEdgeVertex = zeroInEdgeVertices[i];
    const adjacencyEdges = outEdges[zeroInEdgeVertex];

    for (let j: i32 = 0; j < adjacencyEdges.length; ++j) {
      const outEdge = new Array<i32>(2);

      outEdge[0] = zeroInEdgeVertex;
      outEdge[1] = adjacencyEdges[j];

      stack.push(outEdge);
    }
  }

  let pruneTraversed = false;

  while (stack.length > 0) {
    const outEdge = stack.pop() as i32[];
    const fromVertex = outEdge[0];
    const toVertex = outEdge[1];
    const adjacentEdges = outEdges[toVertex];

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

    const traversedToVertexIndex = traversed.indexOf(toVertex);

    if (traversedToVertexIndex > -1) {
      return traversed.slice(traversedToVertexIndex);
    }

    if (!visited[toVertex]) {
      for (let i: i32 = 0; i < adjacentEdges.length; ++i) {
        const nextOutEdge = new Array<i32>(2);

        nextOutEdge[0] = toVertex;
        nextOutEdge[1] = adjacentEdges[i];

        stack.push(nextOutEdge);
      }

      visited[toVertex] = true;
    }

    if (adjacentEdges.length === 0) {
      pruneTraversed = true;
    }
  }

  return [];
}
