import { hook, wrapFactory } from 'jwit';
import { getAttr, getFirst, getHeaders } from '../util';
import applyURL from '../applyURL';

const RETRY_TIMEOUT = 2e3;

export default wrapFactory(() => {
  if (typeof WebSocket == 'undefined') {
    return [];
  }

  return [
    hook(getAttr('sub'), function(node){
      const subscription = getFirst([[node, 'sub']]);
      let destroy;

      const subscribe = () => {
        destroy = applyURL({
          wsUrl: getFirst([[node, 'sub-url']]) || window.wsubURL || '/witsub',
          target: node,
          headers: getHeaders(node, '-sub-header', { 'X-Wok-Call': subscription }),
          onError: () => {
            if(getFirst([[node, 'sub-retry']]) != 'never'){
              setTimeout(subscribe, RETRY_TIMEOUT);
            }
          },
          onLoad: () => {
            if(getFirst([[node, 'sub-retry']]) == 'always'){
              setTimeout(subscribe, RETRY_TIMEOUT);
            }
          },
        });
      };

      subscribe();

      return {
        destroy: () => destroy(),
      };
    })
  ];
});