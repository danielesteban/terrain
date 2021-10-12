import fs from 'fs';
import path from 'path';
import { terser } from 'rollup-plugin-terser';
import wasm from '@rollup/plugin-wasm';

export default {
  input: path.join(__dirname, 'exports.js'),
  external: ['three'],
  output: {
    file: path.join(__dirname, 'terrain.js'),
    format: 'esm',
  },
  plugins: [
    wasm({
      maxFileSize: Infinity,
    }),
    {
      writeBundle() {
        fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify({
          name: 'three-terrain',
          author: 'Daniel Esteban Nombela',
          license: 'MIT',
          files: ['terrain.js'],
          module: 'terrain.js',
          version: '0.0.1',
          homepage: 'https://terrain.gatunes.com',
          repository: {
            type: 'git',
            url: 'https://github.com/danielesteban/terrain',
          },
          dependencies: {
            three: '^0.133.1',
          },
        }, null, '  '));
      },
    },
    ...(!process.env.ROLLUP_WATCH ? [terser()] : []),
  ],
};
