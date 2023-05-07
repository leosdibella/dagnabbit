export function verifyAcyclicity(outEdges: i32[][], inEdges: i32[][]): i32[] {
  if (outEdges.length === 0) {
    return [];
  }

  const zeroInEdgeVertices: i32[] = new Array<i32>(0);

  for (let i: i32 = 0; i < inEdges.length; ++i) {
    // Skip any isolated vertices
    if (inEdges[i].length > 0 || outEdges[i].length === 0) {
      continue;
    }

    zeroInEdgeVertices.push(i);
  }

  const visited = outEdges.map(() => new Array<i32>(0));
  const traversed = new Array<i32>(0);

  // It must have at leaat one cycle
  if (zeroInEdgeVertices.length === 0) {
    const zeroOutEdgeVertices: i32[] = outEdges
      .map<i32>((ie, i) => (ie.length === 0 ? i : -1))
      .filter((ie) => ie > -1);

    const cycleStack = new Array<i32>(0);

    // If no vertices have zero out edges,
    // then starting at any vertex will eventually lead to a cycle
    cycleStack.push(
      zeroOutEdgeVertices.length === 0 ? 0 : zeroOutEdgeVertices[0]
    );

    while (cycleStack.length > 0) {
      const vertex = cycleStack.pop() as i32;
      const existingVertexIndex = traversed.indexOf(vertex);

      if (existingVertexIndex > -1) {
        return traversed.slice(existingVertexIndex).reverse();
      }

      traversed.push(vertex);

      // There has to be one, since no vertex has 0 in edges
      // and it can't lead to a terminal edge otherwise
      // vertex would have 0 in edges
      cycleStack.push(inEdges[vertex][0]);
    }
  }

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
