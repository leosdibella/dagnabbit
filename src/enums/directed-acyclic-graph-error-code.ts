export enum DirectedAcyclicGraphErrorCode {
  notReady,
  cycleDetected,
  duplicateEdge,
  duplicateVertex,
  invalidEdgeDefinition,
  undecodeableWasm,
  uninstantiableWasm,
  missingTopologicalSortingFunction
}
