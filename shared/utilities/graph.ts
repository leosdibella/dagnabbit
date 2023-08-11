import { ISubInterval } from 'shared/interfaces';
import { isNonNegativeInteger } from './numerical';

const maxIntervalLength = 100;
const subDivisionsPerUnit = 4;

function generateRandomSubInterval(originalIndex: number): ISubInterval {
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
    end,
    sortedIndex: -1,
    originalIndex
  };
}

function doSubIntervalsCollide(
  subIntervalOne: ISubInterval,
  subIntervalTwo: ISubInterval,
  inReverse: boolean
) {
  const earlier = inReverse ? subIntervalTwo : subIntervalOne;
  const later = inReverse ? subIntervalOne : subIntervalTwo;

  if (!inReverse && later.start >= earlier.end) {
    return undefined;
  }

  if (inReverse && earlier.start >= later.end) {
    return undefined;
  }

  if (
    earlier.start === later.start ||
    earlier.end === later.end ||
    (earlier.start < later.start && earlier.end > later.start) ||
    (earlier.start > later.start && earlier.start < later.end)
  ) {
    return inReverse ? earlier.sortedIndex : later.sortedIndex;
  }

  return -1;
}

function collideSubIntervalIntoColumn(
  column: ISubInterval[],
  subInterval: ISubInterval,
  inReverse: boolean
) {
  let collisionIndex: number | undefined;
  const toVertices: number[] = [];

  for (let i = 0; i < column.length; ++i) {
    collisionIndex = doSubIntervalsCollide(subInterval, column[i], inReverse);

    if (collisionIndex === undefined) {
      return toVertices.length > 0 ? toVertices : undefined;
    } else if (collisionIndex > -1) {
      toVertices.push(collisionIndex!);
    }
  }

  return toVertices.length > 0 ? toVertices : undefined;
}

function generateForwardDagToVerticesExtended(
  subIntervals: ISubInterval[],
  columns: ISubInterval[][],
  subInterval: ISubInterval,
  linchPinSubInterval: ISubInterval,
  columnIndex: number
) {
  const toVertices: number[] = [];
  let extendedToVertices: number[] | undefined;
  let collisionIndex: number | undefined;

  for (let i = columnIndex + 1; i < columns.length; ++i) {
    extendedToVertices = collideSubIntervalIntoColumn(
      columns[i],
      subInterval,
      false
    );

    if (Array.isArray(extendedToVertices)) {
      if (extendedToVertices.length > 0) {
        for (let j = 0; j < extendedToVertices.length; ++j) {
          collisionIndex = doSubIntervalsCollide(
            linchPinSubInterval,
            subIntervals[extendedToVertices[j]],
            false
          );

          if (collisionIndex === undefined) {
            return toVertices;
          } else {
            toVertices.push(extendedToVertices[j]);
          }
        }
      }

      return toVertices;
    }
  }

  return toVertices;
}

function generateForwardDagToVertices(
  subIntervals: ISubInterval[],
  columns: ISubInterval[][],
  subInterval: ISubInterval,
  columnIndex: number
) {
  let toVertices: number[] | undefined;
  let linchPinSubInterval: ISubInterval;
  const reducedColumnsLength = columns.length - 1;

  for (let i = columnIndex + 1; i < columns.length; ++i) {
    toVertices = collideSubIntervalIntoColumn(columns[i], subInterval, false);

    if (Array.isArray(toVertices)) {
      linchPinSubInterval = subIntervals[toVertices[0]];

      if (
        i < reducedColumnsLength &&
        toVertices.length > 0 &&
        subInterval.end > linchPinSubInterval.start
      ) {
        return toVertices.concat(
          generateForwardDagToVerticesExtended(
            subIntervals,
            columns,
            subInterval,
            linchPinSubInterval,
            i
          )
        );
      }

      return toVertices;
    }
  }

  return [];
}

function generateBackwardDagToVertices(
  columns: ISubInterval[][],
  subInterval: ISubInterval,
  columnIndex: number
) {
  let toVertices: number[] | undefined;

  for (let i = columnIndex - 1; i >= 0; --i) {
    toVertices = collideSubIntervalIntoColumn(columns[i], subInterval, true);

    if (Array.isArray(toVertices)) {
      return toVertices;
    }
  }

  return [];
}

function addSubIntervalToColumn(
  columns: ISubInterval[][],
  subInterval: ISubInterval
) {
  let column: ISubInterval[] | undefined;

  for (let i = 0; i < columns.length; ++i) {
    column = columns[i];

    if (subInterval.start >= column[column.length - 1].end) {
      column.push(subInterval);
      break;
    }

    column = undefined;
  }

  if (column) {
    columns.push([subInterval]);
  }
}

function generateColumns(subIntervals: ISubInterval[]) {
  const columns = [[subIntervals[0]]];

  for (let i = 1; i < subIntervals.length; ++i) {
    addSubIntervalToColumn(columns, subIntervals[i]);
  }

  return columns;
}

export function createRandomDagParameters(numberOfVertices: number) {
  if (!isNonNegativeInteger(numberOfVertices) || numberOfVertices === 0) {
    throw Error(
      `Expected a postivie integer value, received: ${numberOfVertices}`
    );
  }

  const subIntervals = [...new Array(numberOfVertices)]
    .map((_, i) => generateRandomSubInterval(i))
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .map((si, i) => {
      si.sortedIndex = i;

      return si;
    });

  const shouldMakeForwardDag = Math.floor(Math.random() * 2);
  const columns = generateColumns(subIntervals);
  const edges: [number, number][] = [];

  columns.forEach((column, i) => {
    column.forEach((subInterval) => {
      const toVertices = shouldMakeForwardDag
        ? generateForwardDagToVertices(subIntervals, columns, subInterval, i)
        : generateBackwardDagToVertices(columns, subInterval, i);

      toVertices.forEach((v) => {
        edges.push([i, v]);
      });
    });
  });

  return {
    vertices: subIntervals.map((_, i) => i),
    edges
  };
}
