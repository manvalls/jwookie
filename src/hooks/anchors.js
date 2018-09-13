import { hook } from 'jwit';
import { bind, getFirst, isNotSelf, getHeaders, isTrue, getSelector } from '../util';

function onClick(e){
  var headers = {};

  if (isNotSelf( getFirst([[this, 'target']]) )) {
    return;
  }

  e.preventDefault();
  getHeaders(this, '-header', headers);

  request({
    url: getFirst([[this, 'href']]),
    headers,
    asynchronous: isTrue( getFirst([[this, 'async']]) )
  })();
}

hook(getSelector('a'), function(a){
  bind(a, 'click', onClick);
});
