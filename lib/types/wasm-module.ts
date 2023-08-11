import { AcyclicVerifier } from './acyclic-verifier';
import { TopologicalSorter } from './topological-sorter';

export type WasmModule = {
  topologicalSort: TopologicalSorter;
  verifyAcyclicity: AcyclicVerifier;
};
