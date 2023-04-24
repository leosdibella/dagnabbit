import * as fs from 'fs';

const wasmFilePath = 'as-build/release.wasm';
const wasmModuleFilePath = 'as-build/release.js';
const topologicalSortWasmModuleFilePath = `lib/utils/topological-sort-wasm.js`;

function writeTopologicalSortWasmModuleFile() {
  const moduleData = fs.readFileSync(wasmModuleFilePath, 'utf8');
  const moduleDataInitializeDefintion = moduleData.split('export const {')[0];
  const base64TopologicalSortWasm = fs.readFileSync(wasmFilePath).toString('base64');

  const rewrittenModuleData = moduleDataInitializeDefintion.replace(
    'async function instantiate(module, imports = {}) {',
    `export async function instantiateTopologicalSortWasmModule() {
  const base64TopologicalSortWasm = '${base64TopologicalSortWasm}';
  const imports = {};
  function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; ++i) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const module = base64ToArrayBuffer(base64TopologicalSortWasm);`
  ).replace(
    'const { exports } = await WebAssembly.instantiate(module, adaptedImports);',
    `const instantiatedSource = await WebAssembly.instantiate(module, adaptedImports);
const exports = instantiatedSource.exports || (instantiatedSource.instance ? instantiatedSource.instance.exports : undefined);`
  );

  fs.writeFileSync(topologicalSortWasmModuleFilePath, rewrittenModuleData, 'utf8');
}

writeTopologicalSortWasmModuleFile();
