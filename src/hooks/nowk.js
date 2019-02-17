import { hook, wrapFactory, getParent, getLocal } from 'jwit';

const key = {};

const hookNoWk = wrapFactory(() => [hook('[data-no-wk], [no-wk]', function () {
  this.key = key;
})]);

export function wkHook(selector, Constructor) {
  return [
    hookNoWk(),
    hook(selector, function(node, getCallback){
      if (getLocal(node, key) || getParent(node, key)) {
        return;
      }

      return new Constructor(node, getCallback);
    }),
  ]
}
