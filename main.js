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
        wit.apply(res[0])(function(){
          processing = false;
          checkQueue();
          res[1]();
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

  function apply(delta){
    return function(cb){
      cb = cb || function(){};
      queue.push([delta,cb]);
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

          apply(delta)(cb);
        };

        xhr.onerror = function(err){
          cleanup(obj);
          cb(err);
        };

        xhr.open(method, url, true);
        xhr.setRequestHeader('Accept', 'application/json');

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

  function onAnchorClick(e){
    var headers = {};

    e.preventDefault();
    getHeaders(this, 'data-', '-header', headers);

    loading['trigger'](this);
    request({
      'url': this.href,
      'headers': headers,
      'asynchronous': this.getAttribute('data-async') != null
    })(function(err){
      loaded['trigger'](this, err);
    });
  }

  function onFormSubmit(e){
    var headers = {};
    var url, body, i, element, pairs;

    e.preventDefault();
    getHeaders(this, 'data-', '-header', headers);

    url = this.action || location.href;
    url = url.replace(/#.*$/, '');

    if (!this.method || this.method.toLowerCase() == 'get') {
      pairs = [];
      body = null;

      for (i = 0;i < this.elements.length;i++) {
        element = this.elements[i];
        if (element.hasAttribute('name')) {
          switch (element.type.toLowerCase()) {
            case 'radio':
            case 'checkbox':
              if (!element.checked) {
                break;
              }
            default:
              pairs.push(encodeURIComponent(element.name) + (element.value ? '=' + encodeURIComponent(element.value) : ''));
              break;
          }
        }
      }

      if (url.indexOf('?') != -1) {
        url += '&' + pairs.join('&');
      } else {
        url += '?' + pairs.join('&');
      }
    } else {
      body = new FormData(this);
    }

    loading['trigger'](this);
    request({
      'url': url,
      'headers': headers,
      'method': this.method,
      'body': body,
      'asynchronous': this.getAttribute('data-async') != null
    })(function(err){
      loaded['trigger'](this, err);
    });
  }

  function bindAnchors(anchors){
    var i,a;

    for(i = 0;i < anchors.length;i++){
      a = anchors[i];
      if (a.addEventListener) {
        a.addEventListener('click', onAnchorClick, false);
      } else if (a.attachEvent) {
        a.attachEvent('onclick', onAnchorClick);
      }
    }
  }

  function bindForms(forms){
    var i,f;

    if (!w.FormData) {
      return;
    }

    for(i = 0;i < forms.length;i++){
      f = forms[i];
      if (f.addEventListener) {
        f.addEventListener('submit', onFormSubmit, false);
      } else if (f.attachEvent) {
        f.attachEvent('onsubmit', onFormSubmit);
      }
    }
  }

  function processFragment(fragment){
    var anchors = fragment.querySelectorAll('a[data-wk]');
    var forms = fragment.querySelectorAll('form[data-wk]');
    var toRun = fragment.querySelectorAll('[data-wkrun]');

    bindAnchors(anchors);
    bindForms(forms);
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
