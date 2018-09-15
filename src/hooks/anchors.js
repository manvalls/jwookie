import { hook } from 'jwit';
import request from '../request';
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
    asynchronous: isTrue( getFirst([[this, 'async']]) ),
    force: isTrue( getFirst([[this, 'force']]) ),
  })();
}

hook(getSelector('a'), function(a){
  bind(a, 'click', onClick);
});
