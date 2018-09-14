import { queue, apply } from 'jwit';
import getAbsoluteUrl from './getAbsoluteUrl';

const ABORTED = 'Wookie request internally aborted';

var pendingRequests = [];

export function aborted(err){
  return err && err.message == ABORTED;
}

function cleanup(obj){
  var i = pendingRequests.indexOf(obj);
  if (i != -1) {
    pendingRequests.splice(i, 1);
  }
}

function cancel(obj){
  var req = obj.xhr;
  setTimeout(req.onerror, 0, new Error(ABORTED));
  req.onload = req.onerror = null;
  req.abort();
}

function request(options){
  var url, fragment, force, method, headers, body, uploadHandler, asynchronous, refresh, key;

  options = options || {};

  url = options.url || location.href;
  fragment = (url.match(/#.*$/) || [''])[0];
  url = url.replace(/#.*$/, '');
  url = getAbsoluteUrl(url);

  method = options.method || 'GET';
  headers = options.headers || {};
  body = options.body || null;
  uploadHandler = options.uploadHandler || function(){};
  asynchronous = options.asynchronous || false;
  refresh = options.refresh || false;
  force = options.force || false;
  key = options.key || {};

  return function(cb){
    queue(qcb => {
      var i,j,pr,xhr,obj;

      cb = cb || function(){};

      if (asynchronous) {
        pr = pendingRequests;
        for (i = 0;i < pr.length;i++) {
          obj = pr[i];
          if (!obj.asynchronous) {
            setTimeout(cb, 0, new Error(ABORTED));
            qcb();
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

        if (!force && fragment && location.href == url) {
          qcb();
          return;
        }
      }

      xhr = new XMLHttpRequest();
      obj = {xhr: xhr, asynchronous: asynchronous, key: key};
      pendingRequests.push(obj);
      uploadHandler(xhr.upload);

      xhr.onload = function(){
        var delta,finalUrl;

        cleanup(obj);

        try{
          delta = JSON.parse(xhr.responseText);
        }catch(err){
          return cb(err);
        }

        finalUrl = xhr.responseURL || xhr.getResponseHeader('X-Response-Url') || url;
        if (finalUrl.indexOf('#') == -1) {
          finalUrl += fragment;
        }

        finalUrl = getAbsoluteUrl(finalUrl);

        if (
          !asynchronous &&
          typeof history != 'undefined' &&
          history.pushState && history.replaceState &&
          finalUrl != location.href
        ) {
          if (refresh) {
            let st = history.state || {};
            st.__wookie = true;
            history.replaceState(st, '', finalUrl);
          } else {
            history.pushState({__wookie: true}, '', finalUrl);
          }

          location.hash = fragment;
        }

        apply(delta)(cb);
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

      if (typeof SPH !== 'undefined') {
        for (i in SPH) if(SPH.hasOwnProperty(i)) {
          for (j in SPH[i]) if(SPH[i].hasOwnProperty(j)) {
            xhr.setRequestHeader(j, SPH[i][j]);
          }
        }
      }

      for (i in headers) if(headers.hasOwnProperty(i)) {
        xhr.setRequestHeader(i, headers[i]);
      }

      xhr.send(body);
      qcb();
    });
  };
}

export default request;
