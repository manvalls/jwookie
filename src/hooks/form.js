import { hook } from 'jwit';
import { bind, getSelector, getFirst, isNotSelf, getHeaders } from '../util';
import request from '../request';

function onSubmit(e){
  var headers = {};
  var clickedSubmit = this.__wookie_lastClickedSubmit;
  var url, body, method;

  if ( isNotSelf( getFirst([
    [clickedSubmit, 'formtarget'],
    [this, 'target']
  ]) ) ) {
    return;
  }

  getHeaders(this, '-header', headers);
  if (clickedSubmit) {
    getHeaders(clickedSubmit, '-header', headers);
  }

  method = getFirst([
    [clickedSubmit, 'formmethod'],
    [this, 'method']
  ]) || 'GET';

  url = getFirst([
    [clickedSubmit, 'formaction'],
    [this, 'action']
  ]) || location.href;

  if (method.toLowerCase() == 'get') {
    body = null;
    url = getValues(url, null, this);
  } else {
    if (!window.FormData) {
      return;
    }

    body = getValues(null, null, this);
  }

  e.preventDefault();

  request({
    url,
    headers,
    method,
    body,
    asynchronous: isTrue( getFirst([[clickedSubmit, 'async'], [this, 'async']]) )
  })();
}

hook(getSelector('form'), function(form){
  bind(form, 'submit', onSubmit);
});