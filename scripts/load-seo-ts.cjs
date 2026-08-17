/**
 * Load src/seo/*.ts from CommonJS inject scripts using TypeScript transpile.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveTs(request, parent, isMain, options) {
  try {
    return originalResolve.call(this, request, parent, isMain, options);
  } catch (error) {
    if (typeof request !== 'string' || !parent?.filename || !request.startsWith('.')) {
      throw error;
    }
    const base = path.resolve(path.dirname(parent.filename), request);
    for (const candidate of [`${base}.ts`, path.join(base, 'index.ts')]) {
      if (fs.existsSync(candidate)) return candidate;
    }
    throw error;
  }
};

Module._extensions['.ts'] = function compileTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

function loadSeoTs(relativeFromScripts) {
  return require(path.join(__dirname, relativeFromScripts));
}

module.exports = { loadSeoTs };
