import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/wookie.cjs.js',
    format: 'cjs',
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
        ['@babel/plugin-proposal-class-properties', {loose: true}]
      ],
    }),
  ],
};
