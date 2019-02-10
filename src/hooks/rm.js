import { hook, wrapFactory, destroy } from 'jwit';
import { getAttr } from '../util';

export default wrapFactory(() => [hook(getAttr('rm'), function(node){
  setTimeout(() => {
    node.remove();
    destroy(node);
  });
})]);