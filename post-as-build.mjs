import * as fs from 'fs';

const platforms = {
  node: 'node',
  browser: 'browser'
};

const platformBinaryStrings = {
  [platforms.node]: 'Buffer.from(base64, \'base64\').toString(\'binary\')',
  [platforms.browser]: 'atob(base64)'
}

const wasmFilePath = 'as-build/release.wasm';
const wasmModuleFilePath = 'as-build/release.js';

function writeWasmModuleFiles() {
  const moduleData = fs.readFileSync(wasmModuleFilePath, 'utf8');
  const moduleDataInitializeDefinition = moduleData.split('export const {')[0];
  const base64Wasm = fs.readFileSync(wasmFilePath).toString('base64');

  Object.values(platforms).forEach(
    (platform) => {
      const rewrittenModuleData = moduleDataInitializeDefinition.replace(
        'async function instantiate(module, imports = {}) {',
        `export async function instantiateWasmModule() {
          const base64Wasm = '${base64Wasm}';
          const imports = {};
          function base64ToArrayBuffer(base64) {
            const binaryString = ${platformBinaryStrings[platform]}
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

      fs.writeFileSync(`lib/${platform}/wasm.js`, rewrittenModuleData, 'utf8');
    });
}

writeWasmModuleFiles();
