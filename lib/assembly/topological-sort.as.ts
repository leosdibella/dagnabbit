export function topologicalSort(edges: u32[][]): u32[] {
  const vertexCount = edges.length as u32;
  const visitedVertices = new Array<bool>(vertexCount).map(() => false);
  const topologicallySorted = new Array<u32>(0);

  for (let i: u32 = 0; i < vertexCount; ++i) {
    if (!visitedVertices[i]) {
      const stack = new Array<u32[]>(0);
      const firstStackItem = new Array<u32>(2);

      firstStackItem[0] = i;
      firstStackItem[1] = 0;

      stack.push(firstStackItem);

      while (stack.length > 0) {
        const last = stack[stack.length - 1];
        const lastVertexIndex = last[0];
        const lastEdgeIndex = last[1];

        const next: i32 =
          lastVertexIndex >= 0 &&
          (edges[lastVertexIndex].length as u32) > lastEdgeIndex
            ? edges[lastVertexIndex][lastEdgeIndex]
            : -1;

        if (next === -1) {
          if (!visitedVertices[lastVertexIndex]) {
            visitedVertices[lastVertexIndex] = true;
            topologicallySorted.push(lastVertexIndex);
          }

          stack.pop();
        } else if (visitedVertices[next]) {
          ++last[1];
        } else {
          const nextStackItem = new Array<u32>(2);

          nextStackItem[0] = next as u32;
          nextStackItem[1] = 0;

          stack.push(nextStackItem);
        }
      }
    }
  }

  return topologicallySorted.reverse();
}
