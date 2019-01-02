import { getControllers } from 'jwit';

export function isTrue(attr){
  return attr != null && attr.toLowerCase() != 'false';
}

export function isNotSelf(target){
  return target && target != '_self';
}

const prefixes = ['w-', 'data-', ''];

export function getFirst(pairs){
  var i, j, elem, attr, prefixedAttr;

  for(i = 0;i < pairs.length;i++){
    elem = pairs[i][0];
    attr = pairs[i][1];
    if (elem) {
      for(j = 0;j < prefixes.length;j++){
        prefixedAttr = prefixes[j] + attr;
        if (elem.hasAttribute(prefixedAttr)) {
          return elem.getAttribute(prefixedAttr);
        }
      }
    }
  }

  return null;
}

export function areEqual(a, b){
  var i;

  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  if (a.length != b.length) {
    return false;
  }

  for (i = 0;i < a.length;i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export function keys(map){
  var result = [], i;
  for (i in map) if(map.hasOwnProperty(i)) {
    result.push(i);
  }

  return result;
}

export function getHeaders(node, suffix, headers) {
  var i,j,attr,pi,si,prefix;

  for(j = prefixes.length - 1;j >= 0;j--){
    prefix = prefixes[j];
    for(i = 0;i < node.attributes.length;i++){
      attr = node.attributes[i];
      pi = attr.name.indexOf(prefix);
      si = attr.name.indexOf(suffix);
      if (pi == 0 && si == attr.name.length - suffix.length) {
        headers[attr.name.slice(pi + prefix.length, si)] = attr.value;
      }
    }
  }
}

export function bind(element, event, handler) {
  if (element.addEventListener) {
    element.addEventListener(event, handler, false);
  } else if (element.attachEvent) {
    element.attachEvent('on' + event, handler);
  }
}

export function getSelector(selector){
  const selectors = [];
  var i;

  for (i = 0;i < prefixes.length;i++) {
    selectors.push(`${selector}[${prefixes[i]}wk]`);
  }

  return selectors.join(', ');
}

export function getFormElementValues(formElement) {
  var values, i, attr, controllers, ctrl;

  controllers = getControllers(formElement);
  for (i = 0;i < controllers.length;i++) {
    ctrl = controllers[i];
    if (typeof ctrl.overrideInputValues == 'function') {
      try {
        values = ctrl.overrideInputValues();

        if (!(
          values &&
          typeof values.length == 'number' &&
          values.length >= 0 &&
          values.length <= 4294967295
        )) {
          throw new Error('Expected overrideInputValues to return an array, got', values);
        }

        return values;
      } catch(err) {
        setTimeout(() => { throw err; }, 0);
      }
    }
  }

  for(i = 0;i < prefixes.length;i++){
    if(prefixes[i]){
      attr = prefixes[i] + 'value';
      if(formElement.hasAttribute(attr)){
        return [formElement.getAttribute(attr)];
      }
    }
  }

  if (formElement.files) {
    return formElement.files;
  }

  if (formElement.tagName.toLowerCase() == 'select') {
    values = [];

    for (i = 0; i < formElement.options.length; i++) {
        if (formElement.options[i].selected) {
          values.push(formElement.options[i].value);
        }
    }

    return values;
  }

  return [formElement.value];
}

export function getValues(baseURL, whitelist, form) {
  var pairs, body, element, i, j, values, v;

  if (baseURL) {
    pairs = [];
  } else {
    body = new FormData();
  }

  for (i = 0;i < form.elements.length;i++) {
    element = form.elements[i];
    if (element.hasAttribute('name')) {
      switch (element.type.toLowerCase()) {
        case 'radio':
        case 'checkbox':
          if (!element.checked) {
            break;
          }
        default:

          if (whitelist && whitelist.indexOf(element.name) == -1) {
            break;
          }

          values = getFormElementValues(element);
          for (j = 0;j < values.length;j++) {
            v = values[j];
            if (baseURL) {
              if (window.File && v instanceof window.File) {
                v = v.name;
              }

              pairs.push(encodeURIComponent(element.name) + (v ? '=' + encodeURIComponent(v) : ''));
            } else {
              body.append(element.name, v);
            }
          }

          break;

      }
    }
  }

  if (baseURL) {
    return baseURL.replace(/(\?.*?)?(?=#|$)/, '?' + pairs.join('&'));
  }

  return body;
}

export function assign(base){
  for(let i = 1;i < arguments.length;i++){
    const a = arguments[i];
    for (let key in a) if(a.hasOwnProperty(key)){
      base[key] = a[key];
    }
  }

  return base;
}

export function dedupe(array){
  const result = [];

  for(let i = 0;i < array.length;i++){
    const elem = array[i];
    if(result.indexOf(elem) == -1){
      result.push(elem);
    }
  }

  return result;
}