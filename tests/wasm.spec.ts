import { expect } from 'chai';
import 'mocha';
import { instantiateWasmModule } from '../lib/utilities';

describe('Topological Sort', () => {
  it('should be able to topologically sort any directed acyclic graph', async () => {
    const topologicalSortWasmModule = await instantiateWasmModule();
    const topologicalSort = topologicalSortWasmModule.topologicalSort;

    //      4 ---> 5
    //      ^      ^
    //      |      |
    // 0 -> 2 ---> 3
    //      ^
    //      |
    //      1
    const dag1Edges = [[2], [2], [3, 4], [5], [5], []];
    const dag1TopologicallySorted = topologicalSort(dag1Edges);

    expect(dag1TopologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);

    // 4 <-- 5 <-- 6 ----> 7
    // ^     |     ^
    // |     v     |
    // 2 --> 3     |
    // ^           |
    // |           |
    // 0 --------> 1
    const dag2Edges = [[1, 2], [6], [3, 4], [], [], [4], [5, 7], []];
    const dag2TopologicallySorted = topologicalSort(dag2Edges);

    expect(dag2TopologicallySorted).to.deep.equal([0, 2, 3, 1, 6, 7, 5, 4]);

    // 18 <- 19 ---------> 20 ----> 21
    // ^     ^             |        |
    // |     |             |        |
    // |     |             V        V
    // |     14 --> 15 --> 16 ----> 17
    // |     ^              |       |
    // |     |              |       |
    // |     |              v       V
    // 9 --> 10 --> 11 ---> 12 <--- 13
    // ^                    |       ^
    // |                    |       |
    // |                    v       |
    // 5 ---> 6 ---> 7 <--- 8       |
    // ^      ^      ^      ^       |
    // |      |      |      |       |
    // |      |      |      |       |
    // 0 ---> 1 ---> 2 ---> 3 ----> 4
    const dag3Edges = [
      [1, 5],
      [2, 6],
      [3, 7],
      [4, 8],
      [13],
      [6, 9],
      [7],
      [],
      [7],
      [10, 18],
      [11, 14],
      [12],
      [8],
      [12],
      [15, 19],
      [16],
      [12, 17],
      [13],
      [],
      [20],
      [16, 21],
      [17]
    ];

    const dag3TopologicallySorted = topologicalSort(dag3Edges);

    expect(dag3TopologicallySorted).to.deep.equal([
      0, 5, 9, 18, 10, 14, 19, 20, 21, 15, 16, 17, 11, 1, 6, 2, 3, 4, 13, 12, 8,
      7
    ]);
  });
});
