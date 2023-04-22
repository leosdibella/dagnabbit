import * as fs from 'fs';

const destination = 'processed-src';
const source = 'src';

const base64WasmInjectionFilePath = 'classes/directed-acyclic-graph.ts';
const base64WasmInjectionInputFilePath = `${source}/${base64WasmInjectionFilePath}`;
const base64WasmInjectionOuputFilePath = `${destination}/${base64WasmInjectionFilePath}`;
const base64WasmInjectionLocation = 'const base64TopologicalSortWasm = \'\';\n';

const wasmFilePath = 'build/release.wasm';

const tsConfigReplacementFilePath = 'assembly/tsconfig.json';
const tsConfigReplacementInputFilePath = `${source}/${tsConfigReplacementFilePath}`;
const tsConfigReplacementOutputFilePath = `${destination}/${tsConfigReplacementFilePath}`;
const tsConfigReplacementLocation = '"extends": "assemblyscript/std/assembly.json",\n';

function clean() {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  fs.rmSync(destination, {
    recursive: true,
    force: true
  });
}

function copy() {
  fs.cpSync(source, destination, {
    recursive: true
  });
}

function injectBase64Wasm() {
  fs.readFile(base64WasmInjectionInputFilePath, 'utf8', (err, data) => {
    if (err) {
      throw err;
    }

    const base64Wasm = fs.readFileSync(wasmFilePath).toString('base64');
    const parts = data.split(base64WasmInjectionLocation);

    parts.splice(1, 0, `const base64TopologicalSortWasm = \'${base64Wasm}\';\n`);
  
    fs.writeFile(base64WasmInjectionOuputFilePath, parts.join(''), 'utf8', (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

function replaceTsConfig() {
  fs.readFile(tsConfigReplacementInputFilePath, 'utf8', (err, data) => {
    if (err) {
      throw err;
    }

    const parts = data.split(tsConfigReplacementLocation);

    parts.splice(1, 0, '"extends": "assemblyscript/std/portable.json",\n');
  
    fs.writeFile(tsConfigReplacementOutputFilePath, parts.join(''), 'utf8', (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

clean();
copy();
injectBase64Wasm();
replaceTsConfig();
