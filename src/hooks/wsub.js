import { hook, wrapFactory } from 'jwit';
import { getAttr, getFirst, getHeaders } from '../util';
import applyURL from '../applyURL';

const RETRY_TIMEOUT = 2e3;

export default wrapFactory(() => {
  if (typeof WebSocket == 'undefined') {
    return [];
  }

  return [
    hook(getAttr('wsub'), function(node){
      const subscription = getFirst([[node, 'wsub']]);
      let destroy;

      const subscribe = () => {
        destroy = applyURL({
          wsUrl: getFirst([[node, 'wsub-url']]) || window.wsubURL || '/witsub',
          target: node,
          headers: getHeaders(node, '-wsub-header', { 'X-Wok-Call': subscription }),
          onError: () => {
            if(getFirst([[node, 'wsub-retry']]) != 'never'){
              setTimeout(subscribe, RETRY_TIMEOUT);
            }
          },
          onLoad: () => {
            if(getFirst([[node, 'wsub-retry']]) == 'always'){
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