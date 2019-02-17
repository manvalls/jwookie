import { wrapFactory } from 'jwit';
import getAbsoluteUrl from '../getAbsoluteUrl';
import navigate from '../navigate';
import { bind, getFirst, isNotSelf, getHeaders, isTrue, origin } from '../util';
import { historyIsSupported } from '../urlManager';
import { wkHook } from './nowk';

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
    url,
    headers,
    postDone: () => {
      delete this.__wookie_waiting;
    },
  });
}

export default wrapFactory(() => {
  if (historyIsSupported()) {
    return wkHook('a', function (a) {
      bind(a, 'click', onClick);
    });
  }

  return [];
});
