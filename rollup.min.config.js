import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import gzip from 'rollup-plugin-gzip';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/wookie.min.js',
    format: 'iife',
    name: 'wookie',
    globals: {
      jwit: 'wit'
    },
  },
  external: ['jwit'],
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        ['@babel/env', {loose: true}]
      ],
      plugins: [
        ['@babel/plugin-proposal-class-properties', {loose: true}],
        ['@babel/plugin-transform-for-of', {assumeArray: true}],
      ],
    }),
    uglify(),
    gzip()
  ],
};
