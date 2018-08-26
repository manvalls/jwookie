require('jwit');

(function(w){
  var wookie = w['wookie'] = w['wookie'] || {};

  var queue = [];
  var endOfQueueListeners = [];
  var processing = true;

  var loading = wit['event']();
  var loaded = wit['event']();

  function checkQueue(){
    var res,listeners,i;
    if (!processing) {
      if (queue.length) {
        res = queue.shift();
        processing = true;
        wit.apply(res[0],res[1])(function(){
          processing = false;
          checkQueue();
          res[2]();
        });
      } else if (endOfQueueListeners.length) {
        listeners = endOfQueueListeners;
        endOfQueueListeners = [];

        for(i = 0;i < listeners.length;i++) {
          listeners[i]();
        }

        return checkQueue();
      }
    }
  }

  function apply(delta, rootNode){
    return function(cb){
      cb = cb || function(){};
      queue.push([delta,rootNode,cb]);
      checkQueue();
    };
  }

  var pendingRequests = [];

  // https://davidwalsh.name/get-absolute-url
  var getAbsoluteUrl = (function() {
  	var a;

  	return function(url) {
  		if(!a) a = document.createElement('a');
  		a.href = url;

  		return a.href;
  	};
  })();

  function waitForQueue(cb) {
    endOfQueueListeners.push(function(){
      setTimeout(cb, 0);
    });

    checkQueue();
  }

  function request(options){
    var url, method, headers, body, uploadHandler, asynchronous, refresh, key;

    options = options || {};

    url = options['url'] || location.href;
    url = url.replace(/#.*$/, '');
    url = getAbsoluteUrl(url);

    method = options['method'] || 'GET';
    headers = options['headers'] || {};
    body = options['body'] || null;
    uploadHandler = options['uploadHandler'] || function(){};
    asynchronous = options['asynchronous'] || false;
    refresh = options['refresh'] || false;
    key = options['key'] || {};

    return function(cb){
      endOfQueueListeners.push(function(){
        var i,j,req,pr,xhr,obj;

        cb = cb || function(){};

        if (asynchronous) {
          pr = pendingRequests;
          for (i = 0;i < pr.length;i++) {
            obj = pr[i];
            if (!obj.asynchronous) {
              setTimeout(cb, 0, new Error('Aborted'));
              return;
            }

            if (obj.key === key) {
              cleanup(obj);
              cancel(obj);
            }
          }
        } else {
          pr = pendingRequests;
          pendingRequests = [];
          for (i = 0;i < pr.length;i++) {
            cancel(pr[i]);
          }
        }

        xhr = new XMLHttpRequest();
        obj = {xhr: xhr, asynchronous: asynchronous, key: key};
        pendingRequests.push(obj);
        uploadHandler(xhr.upload);

        function cancel(obj){
          var req = obj.xhr;
          setTimeout(req.onerror, 0, new Error('Aborted'));
          req.onload = req.onerror = null;
          req.abort();
        }

        function cleanup(obj){
          var i = pendingRequests.indexOf(obj);
          if (i != -1) {
            pendingRequests.splice(i, 1);
          }
        }

        xhr.onload = function(){
          var delta,href,finalUrl;

          cleanup(obj);

          try{
            delta = JSON.parse(xhr.responseText);
          }catch(err){
            return cb(err);
          }

          finalUrl = xhr.responseURL || xhr.getResponseHeader('X-Response-Url') || url;
          finalUrl = getAbsoluteUrl(finalUrl);

          if (!asynchronous && w.history && history.pushState && history.replaceState && finalUrl != location.href) {
            if (refresh) {
              history.replaceState({'__wookie': true}, '', finalUrl);
            } else {
              history.pushState({'__wookie': true}, '', finalUrl);
            }
          }

          apply(delta, undefined)(cb);
        };

        xhr.onerror = function(err){
          cleanup(obj);
          cb(err);
        };

        xhr.open(method, url, true);
        xhr.setRequestHeader('Accept', 'application/json');
        if (asynchronous) {
          xhr.setRequestHeader('X-Async', 'true');
        }

        if (w['wok']) {
          for (i in wok) if(wok.hasOwnProperty(i)) {
            for (j in wok[i]) if(wok[i].hasOwnProperty(j)) {
              xhr.setRequestHeader(j, wok[i][j]);
            }
          }
        }

        for (i in headers) if(headers.hasOwnProperty(i)) {
          xhr.setRequestHeader(i, headers[i]);
        }

        xhr.send(body);
      });

      checkQueue();
    };
  }

  function runWitCalls(toRun){
    var i,j,parts,path,pairs,pair,arg;

    for (i = 0;i < toRun.length;i++) {
      parts = toRun[i].getAttribute('data-run').split('?');
      if (parts[0]) {
        path = parts[0].split('.');
        arg = {};
        if (parts[1]) {
          pairs = parts[1].split('&');
          for (j = 0;j < pairs.length;j++) {
            pair = pairs[j].split('=');
            if (pair[0]) {
              arg[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
          }
        }

        wit.call(path, arg, toRun[i]);
      }
    }
  }

  function getHeaders(node, prefix, suffix, headers) {
    var i,attr,pi,si;

    for(i = 0;i < node.attributes.length;i++){
      attr = node.attributes[i];
      pi = attr.name.indexOf(prefix);
      si = attr.name.indexOf(suffix);
      if (pi == 0 && si == attr.name.length - suffix.length) {
        headers[attr.name.slice(pi + prefix.length, si)] = attr.value;
      }
    }
  }

  function getFormElementValues(formElement) {
    var values, i;

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

  function getValues(baseURL, whitelist, form) {
    var pairs, body, element, i, j, sep, values;

    if (baseURL) {
      pairs = [];
    } else if(!whitelist) {
      return new FormData(form);
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
              if (baseURL) {
                pairs.push(encodeURIComponent(element.name) + (values[j] ? '=' + encodeURIComponent(values[j]) : ''));
              } else {
                body.append(element.name, values[j]);
              }
            }

            break;

        }
      }
    }

    if (baseURL) {
      return baseURL.replace(/\?.*$/, '') + '?' + pairs.join('&');
    }

    return body;
  }

  function getFirst(pairs){
    var i, elem, attr;

    for(i = 0;i < pairs.length;i++){
      elem = pairs[i][0];
      attr = pairs[i][1];
      if (elem && elem.hasAttribute(attr)) {
        return elem.getAttribute(attr);
      }
    }

    return null;
  }

  function isTrue(attr){
    return attr != null && attr.toLowerCase() != 'false';
  }

  function isNotSelf(target){
    return target && target != '_self';
  }

  function onAnchorClick(e){
    var headers = {};

    if (isNotSelf( getFirst([[this, 'data-target'], [this, 'target']]) )) {
      return;
    }

    e.preventDefault();
    getHeaders(this, 'data-', '-header', headers);

    loading['trigger'](this);
    request({
      'url': getFirst([[this, 'data-href'], [this, 'href']]),
      'headers': headers,
      'asynchronous': isTrue( this.getAttribute('data-async') )
    })(function(err){
      loaded['trigger'](this, err);
    });
  }

  function onFormSubmit(e){
    var headers = {};
    var clickedSubmit = this['__wookie_lastClickedSubmit'];
    var url, body, method, oldEncoding, newEncoding;

    if ( isNotSelf( getFirst([
      [clickedSubmit, 'data-formtarget'],
      [clickedSubmit, 'formtarget'],
      [this, 'data-target'],
      [this, 'target']
    ]) ) ) {
      return;
    }

    getHeaders(this, 'data-', '-header', headers);
    if (clickedSubmit) {
      getHeaders(clickedSubmit, 'data-', '-header', headers);
    }

    method = getFirst([
      [clickedSubmit, 'data-formmethod'],
      [clickedSubmit, 'formmethod'],
      [this, 'data-method'],
      [this, 'method']
    ]) || 'GET';

    url = getFirst([
      [clickedSubmit, 'data-formaction'],
      [clickedSubmit, 'formaction'],
      [this, 'data-action'],
      [this, 'action']
    ]) || location.href;

    url = url.replace(/#.*$/, '');

    if (method.toLowerCase() == 'get') {
      body = null;
      url = getValues(url, null, this);
    } else {
      if (!w.FormData) {
        return;
      }

      newEncoding = getFirst([
        [clickedSubmit, 'data-formenctype'],
        [clickedSubmit, 'formenctype'],
        [this, 'data-enctype'],
      ]);

      if (newEncoding != null) {
        oldEncoding = this.encoding;
        this.encoding = newEncoding;
      }

      body = getValues(null, null, this);

      if (newEncoding != null) {
        this.encoding = oldEncoding;
      }
    }

    e.preventDefault();

    loading['trigger']([this]);
    request({
      'url': url,
      'headers': headers,
      'method': method,
      'body': body,
      'asynchronous': isTrue( getFirst([[clickedSubmit, 'data-async'], [this, 'data-async']]) )
    })(function(err){
      loaded['trigger']([this], err);
    });
  }

  function onSubmitButtonClick(){
    if (this.form) {
      this.form['__wookie_lastClickedSubmit'] = this;
    }
  }

  function onInputChange(){
    onInputBlur.call(this);
  }

  function onInputBlur(){
    this['__wookie_committed'] = true;
    liveUpdate(this, false);
  }

  function shouldBeLiveChecked(element){
    if (element.getAttribute('data-commitonly') != null) {
      return false;
    }

    if (element.getAttribute('data-waitcommit') != null && !element['__wookie_committed']) {
      return false;
    }

    return true;
  }

  function onInputInput(){
    if (shouldBeLiveChecked(this)) {
      liveUpdate(this, false);
    }
  }

  function areEqual(a, b){
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

  function keys(map){
    var result = [], i;
    for (i in map) if(map.hasOwnProperty(i)) {
      result.push(i);
    }

    return result;
  }

  function dependencies(element){
    var deps = element.getAttribute('data-dependencies');
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

  function liveUpdate(element, debounced){
    var values, debounce, wlMap, vMap, i, j, deps, elem, whitelist, livelist, headers, method, url, body, elements;

    clearTimeout(element['__wookie_debounceTimeout']);
    delete element['__wookie_debounceTimeout'];

    debounce = element.getAttribute('data-debounce') || (element.form && element.form.getAttribute('data-debounce'));
    if (debounce && !debounced) {
      element['__wookie_debounceTimeout'] = setTimeout(liveUpdate, parseInt(debounce, 10), element, true);
      return;
    }

    values = getFormElementValues(element);
    if (element['__wookie_lastChecked'] === element.checked && areEqual(element['__wookie_lastValues'], values)) {
      return;
    }

    if (!(element.form && element.name)) {
      return;
    }

    element['__wookie_lastChecked'] = element.checked;
    element['__wookie_lastValues'] = values;

    wlMap = {};
    vMap = {};
    elements = [element];

    wlMap[element.name] = true;
    vMap[element.name] = true;
    deps = dependencies(element);
    for (i = 0;i < deps.length;i++) {
      wlMap[deps[i]] = true;
    }

    for(i = 0;i < element.form.elements.length;i++){
      elem = element.form.elements[i];
      if (elem.getAttribute('data-wk') != null && elem.name && shouldBeLiveChecked(elem)) {
        deps = dependencies(elem);
        if (deps.indexOf(element.name) != -1) {
          if (elements.indexOf(elem) == -1) {
            elements.push(elem);
          }

          wlMap[elem.name] = true;
          vMap[elem.name] = true;
          for (j = 0;j < deps.length;j++) {
            wlMap[deps[j]] = true;
          }
        }
      }
    }

    whitelist = keys(wlMap);
    livelist = keys(vMap);

    headers = {};
    headers['X-Live'] = livelist.join(',');
    getHeaders(element.form, 'data-', '-header', headers);
    getHeaders(element.form, 'data-', '-liveheader', headers);

    method = getFirst([
      [element.form, 'data-livemethod'],
      [element.form, 'data-method'],
      [element.form, 'method'],
    ]) || 'GET';

    url = getFirst([
      [element.form, 'data-liveaction'],
      [element.form, 'data-action'],
      [element.form, 'action'],
    ]) || location.href;

    url = url.replace(/#.*$/, '');

    if (method.toLowerCase() == 'get') {
      body = null;
      url = getValues(url, whitelist, element.form);
    } else {
      if (!w.FormData) {
        return;
      }

      body = getValues(null, whitelist, element.form);
    }

    loading['trigger'](elements);
    request({
      'url': url,
      'headers': headers,
      'method': method,
      'body': body,
      'asynchronous': isTrue( getFirst([[element.form, 'data-liveasync'], [element.form, 'data-async']]) )
    })(function(err){
      loaded['trigger'](elements, err);
    });
  }

  function bindElements(elements, event, handler) {
    var i,e;

    for(i = 0;i < elements.length;i++){
      e = elements[i];
      if (e.addEventListener) {
        e.addEventListener(event, handler, false);
      } else if (e.attachEvent) {
        e.attachEvent('on' + event, handler);
      }
    }
  }

  function processFragment(fragment){
    var anchors = fragment.querySelectorAll('a[data-wk]');
    var forms = fragment.querySelectorAll('form[data-wk]');
    var submitButtons = fragment.querySelectorAll('input[type=submit], button[type=submit], input[type=image]');
    var inputs = fragment.querySelectorAll('input[data-wk], textarea[data-wk], select[data-wk]');
    var toRun = fragment.querySelectorAll('[data-wkrun]');

    bindElements(anchors, 'click', onAnchorClick);
    bindElements(forms, 'submit', onFormSubmit);
    bindElements(submitButtons, 'click', onSubmitButtonClick);
    bindElements(inputs, 'blur', onInputBlur);
    bindElements(inputs, 'change', onInputChange);
    bindElements(inputs, 'input', onInputInput);
    runWitCalls(toRun);
  }

  function init(){
    if(w.removeEventListener) {
      w.removeEventListener('load', init, false);
      document.removeEventListener('DOMContentLoaded', init, false);
    } else if(w.detachEvent) {
      w.detachEvent('onload', init);
    }

    wit['beforeMount'].subscribe(processFragment);
    processFragment(document);

    processing = false;
    checkQueue();
  }

  if (w.addEventListener) {
    w.addEventListener('popstate', function(){
      if (!history.state || !history.state['__wookie']) {
        return;
      }

      loading['trigger'](document.documentElement, 'popstate');
      request({'refresh': true})(function(err){
        loaded['trigger'](document.documentElement, err, 'popstate');
      });
    }, false);
  }

  wookie['apply'] = apply;
  wookie['request'] = request;
  wookie['queue'] = waitForQueue;
  wookie['loading'] = loading;
  wookie['loaded'] = loaded;

  setTimeout(function(){
    if (document.readyState == 'complete') {
      init();
    } else if(w.addEventListener) {
      w.addEventListener('load', init, false);
      document.addEventListener('DOMContentLoaded', init, false);
    } else if(w.attachEvent) {
      w.attachEvent('onload', init);
    }
  }, 0);

  if(typeof module != 'undefined') module['exports'] = wookie;
})(typeof window == 'undefined' ? self : window);
