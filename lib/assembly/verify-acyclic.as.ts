export function verifyAcyclic(edges: u32[][]): u32[] {
  const vertexCount = edges.length as u32;
  const reverseEdges: u32[][] = new Array<bool>(vertexCount).map(() => []);
  const visitedVertices = new Array<bool>(vertexCount).map(() => false);

  for (let i: u32 = 0; i < vertexCount; ++i) {
    const vertexEdges = edges[i];

    for (let j: u32 = 0; j < (vertexEdges.length as u32); ++j) {
      reverseEdges[vertexEdges[j]].push(i);
    }
  }

  for (let i: u32 = 0; i < vertexCount; ++i) {
    // every vertex with an edge to this one has been checked already
    if (
      visitedVertices[i] ||
      reverseEdges[i]
        .map((vertexIndex) => visitedVertices[vertexIndex])
        .reduce((a, b) => a && b, false)
    ) {
      visitedVertices[i] = true;
      continue;
    }

    const stack = edges[i].map((vertexIndex) => {
      const edge = new Array<u32>(2);

      edge[0] = i;
      edge[1] = vertexIndex;

      return edge;
    });

    visitedVertices[i] = true;

    while (stack.length > 0) {
      const edge = stack.pop();

      if (visitedVertices[edge[1]]) {
        return;
      } else {
      }
    }
  }

  return new Array<u32>(0);
}
