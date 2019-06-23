import { getControllerAbove, getController } from 'jwit';
import getAbsoluteUrl from '../getAbsoluteUrl';
import navigate from '../navigate';
import { bind, getFirst, isNotSelf, getHeaders, isTrue, origin } from '../util';
import { historyIsSupported } from '../urlManager';
import { NoWKHook } from './nowk';

function onClick(e){
  var headers = {};

  if (isNotSelf( getFirst([[this, 'target']]) )) {
    return;
  }

  const url = getFirst([[this, 'href']]);

  if (url && (origin(url) != origin(location.href))) {
    return;
  }

  if (
    url &&
    !isTrue( getFirst([[this, 'force']]) ) &&
    url.match(/#.*$/) &&
    location.href.replace(/#.*$/, '') == getAbsoluteUrl(url).replace(/#.*$/, '')
  ) {
    return;
  }

  e.preventDefault();

  if (!isTrue( getFirst([[this, 'nodebounce']]) ) && this.__wookie_waiting) {
    return;
  }

  this.__wookie_waiting = true;
  getHeaders(this, '-header', headers);

  navigate({
    target: this,
    url,
    headers,
    postDone: () => {
      delete this.__wookie_waiting;
    },
  });
}

export class AnchorHook {
  static elements = ['a']
  
  static shouldHook(){
    return historyIsSupported()
  }

  constructor({ node }){
    if (getController(node, NoWKHook) || getControllerAbove(node, NoWKHook)) {
      return
    }

    bind(node, 'click', onClick);
  }
}
