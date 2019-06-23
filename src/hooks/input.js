import { getControllerAbove, getController } from 'jwit';
import { NoWKHook } from './nowk';

import {
  bind,
  getFirst,
  getHeaders,
  isTrue,
  getFormElementValues,
  areEqual,
  keys,
  getValues,
} from '../util';

import { historyIsSupported } from '../urlManager';
import navigate from '../navigate';
import applyURL from '../applyURL';

function dependencies(element){
  var deps = getFirst([[element, 'deps']]);
  var i, filtered, dep;

  if (deps == null) {
    return [];
  }

  deps = deps.split(/\s+/);
  filtered = [];

  for (i = 0;i < deps.length;i++){
    dep = decodeURIComponent(deps[i]);
    if (dep) {
      filtered.push(dep);
    }
  }

  return filtered;
}

function onBlur(){
  if (isEligible(this)) {
    this.__wookie_committed = true;
    liveUpdate(this, false);
  }
}

function onInput(){
  if (
    !isTrue(getFirst([[this, 'commitonly'], [this.form, 'commitonly']])) &&
    shouldBeLiveChecked(this)
  ) {
    liveUpdate(this, false);
  }
}

function isEligible(element){
  if (!(element.form && element.name)) {
    return false;
  }

  return isTrue(getFirst([
    [element, 'live'],
    [element.form, 'live'],
  ]));
}

function shouldBeLiveChecked(element){
  if (!isEligible(element)) {
    return false;
  }

  if (
    !element.__wookie_committed &&
    (
      isTrue(getFirst([[element, 'waitcommit'], [element.form, 'waitcommit']])) ||
      isTrue(getFirst([[element, 'commitonly'], [element.form, 'commitonly']]))
    )
  ) {
    return false;
  }

  return true;
}

function liveUpdate(element, debounced){
  var values, debounce, toInclude, toCheck, i, deps, formElem, headers, method, url, body, whitelist;

  clearTimeout(element.__wookie_debounceTimeout);
  delete element.__wookie_debounceTimeout;

  debounce = getFirst([
    [element, 'debounce'],
    [element.form, 'debounce'],
  ]);

  if (isTrue(debounce) && !debounced) {
    element.__wookie_debounceTimeout = setTimeout(liveUpdate, parseInt(debounce || '0', 10), element, true);
    return;
  }

  values = getFormElementValues(element);
  if (element.__wookie_lastChecked === element.checked && areEqual(element.__wookie_lastValues, values)) {
    return;
  }

  element.__wookie_lastChecked = element.checked;
  element.__wookie_lastValues = values;

  toInclude = {};
  toCheck = {};

  function add(elem, deps){
    var i;

    toInclude[elem.name] = true;
    toCheck[elem.name] = true;
    for (i = 0;i < deps.length;i++) {
      toInclude[deps[i]] = true;
    }
  }

  add(element, dependencies(element));

  for(i = 0;i < element.form.elements.length;i++){
    formElem = element.form.elements[i];
    if (shouldBeLiveChecked(formElem)) {
      deps = dependencies(formElem);
      if (isTrue(getFirst([[element.form, 'dep']])) || deps.indexOf(element.name) != -1) {
        add(formElem, deps);
      }
    }
  }

  headers = {};
  headers['X-Live'] = keys(toCheck).join(',');
  getHeaders(element.form, '-header', headers);
  getHeaders(element.form, '-liveheader', headers);

  method = getFirst([
    [element.form, 'livemethod'],
    [element.form, 'method'],
  ]) || 'GET';

  url = getFirst([
    [element.form, 'liveaction'],
    [element.form, 'action'],
  ]) || location.href;

  if (!isTrue(getFirst([[element.form, 'includeall']]))) {
    whitelist = keys(toInclude);
  }

  if (method.toLowerCase() == 'get') {
    body = null;
    url = getValues(url, whitelist, element.form);
  } else {
    if (!window.FormData) {
      return;
    }

    body = getValues(null, whitelist, element.form);
  }

  if (element.__wookie_cancelLast) {
    element.__wookie_cancelLast();
  }

  let request = applyURL;
  if (isTrue( getFirst([[element.form, 'liveurl']]) )) {
    request = navigate;
  }
  
  element.__wookie_cancelLast = request({
    target: element,
    url,
    headers,
    method,
    body,
    postDone: () => {
      delete element.__wookie_cancelLast;
    },
  });
}

export function commit(element){
  onBlur.call(element)
}

export function notifyChange(element){
  onInput.call(element)
}

export class InputHook {
  static elements = ['input', 'textarea', 'select']

  static shouldHook() {
    return historyIsSupported()
  }

  constructor({ node }) {
    if (getController(node, NoWKHook) || getControllerAbove(node, NoWKHook)) {
      return
    }
    
    this.node = node

    bind(node, 'change', onBlur);
    bind(node, 'blur', onBlur);
    bind(node, 'input', onInput);
    
    if (isTrue( getFirst([[node, 'autofocus']]) )) {
      node.focus();
    }
  }

  onDestroy() {
    if (this.node.__wookie_cancelLast) {
      this.node.__wookie_cancelLast();
    }
  }
}
