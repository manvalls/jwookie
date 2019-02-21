import { wrapFactory } from 'jwit';
import { getAttr } from '../util';
import { wkHook } from './nowk';

export default wrapFactory(() => wkHook(getAttr('disabled'), function(node){
  if ('disabled' in node) {
    node.disabled = true;
  }
}));