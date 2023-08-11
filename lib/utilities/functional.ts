import { WebWorkerFunctionDefinition } from 'lib/types';

export function parseFunctionDefinition(
  // eslint-disable-next-line @typescript-eslint/ban-types
  functionReference: Function
): WebWorkerFunctionDefinition {
  const functionText = functionReference.toString().trim();
  const firstBraceIndex = functionText.indexOf('{');
  const isPlainFunction = functionText.startsWith('function ');

  const functionSignature = functionText.slice(
    0,
    isPlainFunction ? firstBraceIndex : functionText.indexOf('=>')
  );

  return {
    functionBody: functionText.slice(
      // remove everything preceeding {
      firstBraceIndex + 1,
      // remove }
      functionText.length - 1
    ),
    argumentNames: functionSignature
      .slice(functionSignature.indexOf('(') + 1, functionSignature.indexOf(')'))
      .split(',')
      .map((argument) => argument.trim())
      .filter((argument) => argument.length > 0)
  };
}
