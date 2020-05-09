import config from '@vlrz/rollup-config'

export default config({
  name: 'wookie',
  external: [
    '@vlrz/wc-utils',
    'apply-url',
    'create-link',
    'jwit',
  ],
})
