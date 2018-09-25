import { hook } from 'jwit';
import request from '../request';
import { bind, getFirst, isNotSelf, getHeaders, isTrue, getSelector } from '../util';
import { historyIsSupported } from '../urlManager';

function onClick(e){
  var headers = {};

  if (isNotSelf( getFirst([[this, 'target']]) )) {
    return;
  }

  e.preventDefault();

  if (!isTrue( getFirst([[this, 'nodebounce']]) ) && this.__wookie_waiting) {
    return;
  }

  this.__wookie_waiting = true;
  getHeaders(this, '-header', headers);

  request({
    url: getFirst([[this, 'href']]),
    headers,
    asynchronous: isTrue( getFirst([[this, 'async']]) ),
    force: isTrue( getFirst([[this, 'force']]) ),
  })(err => {
    delete this.__wookie_waiting;
  });
}

if (historyIsSupported()) {
  hook(getSelector('a'), function (a) {
    bind(a, 'click', onClick);
  });
}
