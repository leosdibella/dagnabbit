import * as fs from 'fs';

const wasmFilePath = 'as-build/release.wasm';
const wasmModuleFilePath = 'as-build/release.js';
const wasmModuleJsFilePath = `lib/utilities/wasm.js`;

function writeWasmModuleFile() {
  const moduleData = fs.readFileSync(wasmModuleFilePath, 'utf8');
  const moduleDataInitializeDefinition = moduleData.split('export const {')[0];
  const base64Wasm = fs.readFileSync(wasmFilePath).toString('base64');

  const rewrittenModuleData = moduleDataInitializeDefinition.replace(
    'async function instantiate(module, imports = {}) {',
    `export async function instantiateWasmModule() {
  const base64Wasm = '${base64Wasm}';
  const imports = {};
  function base64ToArrayBuffer(base64) {
    const binaryString = typeof atob === 'function'
      ? atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; ++i) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  const module = base64ToArrayBuffer(base64Wasm);`
  ).replace(
    'const { exports } = await WebAssembly.instantiate(module, adaptedImports);',
    `const instantiatedSource = await WebAssembly.instantiate(module, adaptedImports);
const exports = instantiatedSource.exports || (instantiatedSource.instance ? instantiatedSource.instance.exports : undefined);`
  );

  fs.writeFileSync(wasmModuleJsFilePath, rewrittenModuleData, 'utf8');
}

writeWasmModuleFile();
