import { wrapFactory, destroy } from 'jwit';
import { getAttr } from '../util';
import { wkHook } from './nowk';

export default wrapFactory(() => wkHook(getAttr('rm'), function(node){
  setTimeout(() => {
    node.remove();
    destroy(node);
  });
}));