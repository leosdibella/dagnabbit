export function topologicalSort(edges: i32[][]): i32[] {
  const visitedVertices = new Array<bool>(edges.length).map(() => false);
  const topologicallySorted = new Array<i32>(0);

  for (let i: i32 = 0; i < edges.length; ++i) {
    if (!visitedVertices[i]) {
      const stack = new Array<i32[]>(0);
      const firstStackItem = new Array<i32>(2);

      firstStackItem[0] = i;
      firstStackItem[1] = 0;

      stack.push(firstStackItem);

      while (stack.length > 0) {
        const last = stack[stack.length - 1];
        const lastVertexIndex = last[0];
        const lastEdgeIndex = last[1];

        const next: i32 =
          lastVertexIndex >= 0 && edges[lastVertexIndex].length > lastEdgeIndex
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
          const nextStackItem = new Array<i32>(2);

          nextStackItem[0] = next;
          nextStackItem[1] = 0;

          stack.push(nextStackItem);
        }
      }
    }
  }

  return topologicallySorted.reverse();
}
