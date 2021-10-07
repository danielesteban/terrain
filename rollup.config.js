import fs from 'fs';
import path from 'path';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import resolve from '@rollup/plugin-node-resolve';
import serve from 'rollup-plugin-serve';
import { terser } from 'rollup-plugin-terser';
import wasm from '@rollup/plugin-wasm';

const outputPath = path.resolve(__dirname, 'dist');

export default {
  input: path.join(__dirname, 'main.js'),
  output: {
    dir: outputPath,
    format: 'iife',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    wasm({
      maxFileSize: Infinity,
    }),
    copy({
      targets: [
        { src: 'index.*', dest: 'dist' },
        { src: 'screenshot.png', dest: 'dist' },
        { src: 'sounds/*.ogg', dest: 'dist/sounds' },
      ],
      copyOnce: !process.env.ROLLUP_WATCH,
    }),
    ...(process.env.ROLLUP_WATCH ? [
      serve({
        contentBase: outputPath,
        port: 8080,
      }),
      livereload(outputPath),
    ] : [
      terser(),
      {
        writeBundle() {
          fs.writeFileSync(path.join(outputPath, 'CNAME'), 'terrain.gatunes.com');
        },
      },
    ]),
  ],
  watch: { clearScreen: false },
};
