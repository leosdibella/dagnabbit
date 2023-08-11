import { DirectedAcyclicGraph } from '../lib/browser/directed-acyclic-graph';
import './components';
import 'reflect-metadata';

function initialize() {
  const dag = new DirectedAcyclicGraph();

  dag.topologicalSort();
}

initialize();
