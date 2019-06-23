import { getControllerAbove, getController } from 'jwit';
import { NoWKHook } from './nowk';
import { getAttr, getFirst, getHeaders } from '../util';
import applyURL from '../applyURL';

const RETRY_TIMEOUT = 2e3;

export class WokSubHook {
  static attributes = getAttr('sub')

  static shouldHook() {
    return typeof WebSocket != 'undefined'
  }

  constructor({ node }) {
    if (getController(node, NoWKHook) || getControllerAbove(node, NoWKHook)) {
      return
    }

    const subscription = getFirst([[node, 'sub']]);

    const subscribe = () => {
      this.destroy = applyURL({
        target: node,
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
  }
}