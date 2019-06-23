import { getControllerAbove, getController } from 'jwit';
import { NoWKHook } from './nowk';

import {
  bind,
  getFirst,
  isNotSelf,
  getHeaders,
  isTrue,
  getValues,
  origin,
} from '../util';

import { historyIsSupported } from '../urlManager';
import navigate from '../navigate';

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

  if (origin(url) != origin(location.href)) {
    return;
  }

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
  if (!isTrue(getFirst([
    [clickedSubmit, 'nodebounce'],
    [this, 'nodebounce']
  ])) && this.__wookie_waiting) {
    return;
  }

  this.__wookie_waiting = true;

  navigate({
    target: this,
    url,
    headers,
    method,
    body,
    postDone: () => {
      delete this.__wookie_waiting;
    },
  });
}

export class FormHook {
  static elements = ['form']

  static shouldHook() {
    return historyIsSupported()
  }

  constructor({ node }) {
    if (getController(node, NoWKHook) || getControllerAbove(node, NoWKHook)) {
      return
    }
    
    bind(node, 'submit', onSubmit);
  }
}
