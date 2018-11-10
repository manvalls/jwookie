import { queue, apply, getEventTrigger } from 'jwit';
import getAbsoluteUrl from './getAbsoluteUrl';
import { push, replace, historyIsSupported } from './urlManager';

import {
  loading,
  loadingCapture,
  load,
  loadCapture,
  error,
  errorCapture,
  aborted,
  abortedCapture,
  uploadProgress,
  uploadProgressCapture,
  downloadProgress,
  downloadProgressCapture,
} from './events';

const ABORTED = 'Wookie request internally aborted';

var pendingRequests = [];

export function isAborted(err){
  return err && err.message == ABORTED;
}

function getTrigger(node, event, global, globalCapture, baseData){
  const trigger = getEventTrigger(node, event);

  return (datas, cb) => trigger([
      e => {
        datas = datas.concat(baseData)
        for (let i = 0;i < datas.length;i++) {
          const data = datas[i];
          for (let key in data) if (data.hasOwnProperty(key)){
            e[key] = data[key];
          }
        }
      },
      e => globalCapture.trigger(e),
    ], [
      e => global.trigger(e),
      cb || (() => {}),
    ]
  );
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
  var url, fragment, force, method, headers, body, asynchronous, refresh, key, target;

  options = options || {};

  url = options.url || location.href;
  fragment = (url.match(/#.*$/) || [''])[0];
  url = url.replace(/#.*$/, '');
  url = getAbsoluteUrl(url);
  
  method = options.method || 'GET';
  headers = options.headers || {};
  body = options.body || null;
  asynchronous = options.asynchronous || false;
  refresh = options.refresh || false;
  force = options.force || false;
  key = options.key || {};
  target = options.target || null;

  return function(cb){
    queue(qcb => {
      var i,j,pr,xhr,obj;

      const baseEventData = { url, force, method, headers, body, asynchronous, refresh, key, target };
      const abortedTrigger = getTrigger(target, 'Aborted', aborted, abortedCapture, baseEventData);

      cb = cb || function(){};

      if (asynchronous) {
        pr = pendingRequests;
        for (i = 0;i < pr.length;i++) {
          obj = pr[i];
          if (!obj.asynchronous) {
            setTimeout(() => {
              const error = new Error(ABORTED);
              abortedTrigger([{ error }], e => cb(error, e));
            }, 0);
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

        if (!force && fragment && location.href.replace(/#.*$/, '') == url) {
          qcb();
          return;
        }
      }

      const loadingTrigger = getTrigger(target, 'Loading', loading, loadingCapture, baseEventData);
      const loadTrigger = getTrigger(target, 'Load', load, loadCapture, baseEventData);
      const errorTrigger = getTrigger(target, 'Error', error, errorCapture, baseEventData);
      const uploadProgressTrigger = getTrigger(target, 'UploadProgress', uploadProgress, uploadProgressCapture, baseEventData);
      const downloadProgressTrigger = getTrigger(target, 'DownloadProgress', downloadProgress, downloadProgressCapture, baseEventData);

      xhr = new XMLHttpRequest();
      obj = { xhr, asynchronous, key };
      pendingRequests.push(obj);

      xhr.onprogress = function({ loaded, total }){
        downloadProgressTrigger([{ loaded, total }]);
      };

      if(xhr.upload){
        xhr.upload.onprogress = function({ loaded, total }){
          uploadProgressTrigger([{ loaded, total }]);
        };
      }

      xhr.onload = function(){
        var delta,finalUrl;

        cleanup(obj);

        try{
          delta = JSON.parse(xhr.responseText);
        }catch(error){
          return errorTrigger([{ error }], e => cb(error, e));
        }

        finalUrl = xhr.responseURL || xhr.getResponseHeader('X-Response-Url') || url;
        if (finalUrl.indexOf('#') == -1) {
          finalUrl += fragment;
        }

        finalUrl = getAbsoluteUrl(finalUrl);

        if (
          !asynchronous &&
          historyIsSupported() &&
          finalUrl != location.href
        ) {
          if (refresh) {
            replace(finalUrl);
          } else {
            push(finalUrl);
          }
        }

        apply(delta)(function(error){
          if (fragment) {
            location.hash = fragment;
          }
          
          if(error){
            errorTrigger([{ error }], e => cb(error, e));
          } else {
            loadTrigger([], e => cb(undefined, e));
          }
        });
      };

      xhr.onerror = function(error){
        cleanup(obj);

        if (isAborted(error)) {
          abortedTrigger([{ error }], e => cb(error, e));
        } else {
          const { defaultPrevented } = errorTrigger([{ error }], e => cb(error, e));
          if (!defaultPrevented) {
            location.href = url;
          }
        }
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
      loadingTrigger([]);
      qcb();
    });
  };
}

export default request;
