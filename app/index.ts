import { DirectedAcyclicGraph } from '../dist/classes/directed-acyclic-graph';

const maxIntervalLength = 100;
const subDivisionsPerUnit = 4;

const selectors = {

};

const state = {
  page: {
    isRunning: false
  },
  form: {
    primaryGroup: {
      numberOfTrials: undefined as undefined | 'multiple' | 'single'
    },
    singleGroup: {
      numberOfVertices: 1,
      randomize: false
    },
    multipleGroup: {
      numberOfTrials: 1
    }
  }
};

function generateRandomSubInterval() {
  const startingSubInterval = Math.floor(
    Math.random() * (maxIntervalLength - 1)
  );

  const startingSubdivision = Math.floor(Math.random() * subDivisionsPerUnit);
  const start = startingSubInterval + startingSubdivision / subDivisionsPerUnit;
  const remainingIntervalLength = maxIntervalLength - start;

  const end = Math.min(
    maxIntervalLength,
    start +
      Math.max(
        Math.floor(
          Math.random() * remainingIntervalLength + 1 / subDivisionsPerUnit
        ),
        1 / subDivisionsPerUnit
      )
  );

  return {
    start,
    end
  };
}

function createRandomDags(numberOfVertices: number) {

}

function run() {
  if (!state.form.primaryGroup.numberOfTrials) {
    return;
  }

  if (state.form.primaryGroup.numberOfTrials === 'single') {

  } else {

  }
}

function initialize() {

}

initialize();
