import { expect } from 'chai';
import 'mocha';
import { instantiateWasmModule } from '../lib/utilities';

describe('Directed Graph Utilities', () => {
  it('should be able to detect cyclies in any directed graph', async () => {
    const wasmModule = await instantiateWasmModule();

    //      4 ---> 5 ------
    //      ^      ^      |
    //      |      |      |
    // 0 -> 2 ---> 3      |
    //      ^             |
    //      |             |
    //      1 <------------
    const cycle1 = wasmModule.verifyAcyclicity(
      [[2], [2], [3, 4], [5], [5], [1]],
      [[], [5], [0, 1], [2], [2], [3, 4]]
    );

    expect(cycle1).to.deep.equal([2, 4, 5, 1]);

    const cycle2 = wasmModule.verifyAcyclicity(
      [[2], [2], [3, 4], [5], [5], []],
      [[], [], [0, 1], [2], [2], [3, 4]]
    );

    expect(cycle2).to.deep.equal([]);

    //             ---------
    //             |       |
    //             v       |
    // 4 <-- 5 <-- 6 ----> 7
    // ^     |     ^
    // |     v     |
    // 2 --> 3     |
    // ^           |
    // |           |
    // 0 --------> 1
    const cycle3 = wasmModule.verifyAcyclicity(
      [[1, 2], [6], [3, 4], [], [], [4], [5, 7], [6]],
      [[], [0], [0], [2, 5], [2, 5], [6], [1, 7], [6]]
    );

    expect(cycle3).to.deep.equal([6, 7]);

    const cycle4 = wasmModule.verifyAcyclicity(
      [[1, 2], [6], [3, 4], [], [], [4], [5, 7], []],
      [[], [0], [0], [2, 5], [2, 5], [6], [1], [6]]
    );

    expect(cycle4).to.deep.equal([]);

    // 18 <- 19 ---------> 20 ----> 21 -------
    // ^     ^             |        |        |
    // |     |             |        |        |
    // |     |             V        V        |
    // |     14 --> 15 --> 16 ----> 17       |
    // |     ^              |       |        |
    // |     |              |       |        |
    // |     |              v       V        |
    // 9 --> 10 --> 11 ---> 12 <--- 13       |
    // ^                    |       ^        |
    // |                    |       |        |
    // |                    v       |        |
    // 5 ---> 6 ---> 7 <--- 8       |        |
    // ^      ^      ^      ^       |        |
    // |      |      |      |       |        |
    // |      |      |      |       |        |
    // 0 ---> 1 ---> 2 ---> 3 ----> 4        |
    // ^                                     |
    // |                                     |
    // ---------------------------------------
    const cycle5 = wasmModule.verifyAcyclicity(
      [
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
        [0, 17]
      ],
      [
        [21],
        [0],
        [1],
        [2],
        [3],
        [0],
        [1, 5],
        [2, 6],
        [3, 12],
        [5],
        [9],
        [10],
        [11, 16],
        [4, 17],
        [10],
        [14],
        [15, 20],
        [16, 21],
        [9, 19],
        [14],
        [19],
        [20]
      ]
    );

    expect(cycle5).to.deep.equal([5, 9, 10, 14, 19, 20, 21, 0]);

    const cycle6 = wasmModule.verifyAcyclicity(
      [
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
      ],
      [
        [],
        [0],
        [1],
        [2],
        [3],
        [0],
        [1, 5],
        [2, 6],
        [3, 12],
        [5],
        [9],
        [10],
        [11, 13, 16],
        [4, 17],
        [10],
        [14],
        [15, 20],
        [16, 21],
        [9, 19],
        [14],
        [19],
        [20]
      ]
    );

    expect(cycle6).to.deep.equal([]);
  });

  it('should be able to topologically sort any directed acyclic graph', async () => {
    const wasmModule = await instantiateWasmModule();

    //      4 ---> 5
    //      ^      ^
    //      |      |
    // 0 -> 2 ---> 3
    //      ^
    //      |
    //      1
    const dag1TopologicallySorted = wasmModule.topologicalSort([
      [2],
      [2],
      [3, 4],
      [5],
      [5],
      []
    ]);

    expect(dag1TopologicallySorted).to.deep.equal([1, 0, 2, 4, 3, 5]);

    // 4 <-- 5 <-- 6 ----> 7
    // ^     |     ^
    // |     v     |
    // 2 --> 3     |
    // ^           |
    // |           |
    // 0 --------> 1
    const topologicallySorted2 = wasmModule.topologicalSort([
      [1, 2],
      [6],
      [3, 4],
      [],
      [],
      [4],
      [5, 7],
      []
    ]);

    expect(topologicallySorted2).to.deep.equal([0, 2, 3, 1, 6, 7, 5, 4]);

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
    const topologicallySorted3 = wasmModule.topologicalSort([
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
    ]);

    expect(topologicallySorted3).to.deep.equal([
      0, 5, 9, 18, 10, 14, 19, 20, 21, 15, 16, 17, 11, 1, 6, 2, 3, 4, 13, 12, 8,
      7
    ]);
  });
});
