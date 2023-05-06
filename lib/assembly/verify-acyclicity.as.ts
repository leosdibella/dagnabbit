export function verifyAcyclicity(outEdges: i32[][], inEdges: i32[][]): i32[] {
  if (outEdges.length === 0) {
    return [];
  }

  const zeroInEdgeVertices: i32[] = inEdges
    .map<i32>((ie, i) => (ie.length === 0 ? i : -1))
    .filter((ie) => ie > -1);

  const visited = outEdges.map(() => new Array<i32>(0));
  const traversed = new Array<i32>(0);

  /*if (zeroInEdgeVertices.length === 0) {
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
  }*/

  const stack: i32[][] = new Array<i32[]>(0);

  for (let i: i32 = 0; i < zeroInEdgeVertices.length; ++i) {
    const zeroInEdgeVertex = zeroInEdgeVertices[i];
    const adjacencyEdges = outEdges[zeroInEdgeVertex];

    for (let j: i32 = 0; j < adjacencyEdges.length; ++j) {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const edge = new Array<i32>(3);

      edge[0] = zeroInEdgeVertex;
      edge[1] = adjacencyEdges[j];
      edge[2] = -1;

      stack.push(edge);
    }
  }

  let pruneTraversed = false;

  while (stack.length > 0) {
    const edge = stack.pop() as i32[];
    const fromVertex = edge[0];
    const toVertex = edge[1];
    const inEdgeVertex = edge[2];
    const adjacentEdges = outEdges[toVertex];

    if (inEdgeVertex !== -1) {
      visited[fromVertex].push(inEdgeVertex);
    }

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
    } else if (traversed.indexOf(fromVertex) === -1) {
      traversed.push(fromVertex);
    }

    const traversedToVertexIndex = traversed.indexOf(toVertex);

    if (traversedToVertexIndex > -1) {
      return traversed.slice(traversedToVertexIndex);
    }

    for (let i: i32 = 0; i < adjacentEdges.length; ++i) {
      const nextToVertex = adjacentEdges[i];

      if (visited[toVertex].indexOf(nextToVertex) > -1) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      const nextEdge = new Array<i32>(3);

      nextEdge[0] = toVertex;
      nextEdge[1] = nextToVertex;
      nextEdge[2] = -1;

      stack.push(nextEdge);
    }

    if (adjacentEdges.length === 0) {
      pruneTraversed = true;
    } else if (stack.length > 0) {
      stack[stack.length - 1][2] = fromVertex;
    }
  }

  return [];
}
