import { queue, apply, getEventTrigger } from 'jwit';
import getAbsoluteUrl from './getAbsoluteUrl';
import { assign, dedupe } from './util';

import {
  loading,
  loadingCapture,
  load,
  loadCapture,
  error,
  errorCapture,
  abort,
  abortCapture,
  uploadProgress,
  uploadProgressCapture,
  downloadProgress,
  downloadProgressCapture,
  response,
  responseCapture,
  doneCapture,
  done,
} from './events';

function applyURL(options){
  var url, fragment, method, headers, body, target;

  options = options || {};

  url = options.url || location.href;
  fragment = (url.match(/#.*$/) || [''])[0];
  url = url.replace(/#.*$/, '');
  url = getAbsoluteUrl(url);
  
  method = options.method || 'GET';
  headers = options.headers || {};
  body = options.body || null;
  target = options.target || null;

  const requestId = Math.random().toString(36).slice(-10) +
                    Math.random().toString(36).slice(-10) +
                    Date.now().toString(36);
  
  const baseEventData = { url, method, headers, body, target, requestId };

  function getTrigger(event, global, globalCapture){
    const trigger = getEventTrigger(target, event);
  
    return (data) => {
      trigger([
        e => {
          assign(e, baseEventData, data);
        },
        e => {
          if (typeof options['capture' + event] == 'function') {
            options['capture' + event](e);
          }
        },
        e => {
          globalCapture.trigger(e);
        },
      ], [
        e => {
          global.trigger(e);
        },
        e => {
          if (typeof options['on' + event] == 'function') {
            options['on' + event](e);
          }
        },
      ]);

      if (typeof options['post' + event] == 'function') {
        try{
          options['post' + event]();
        }catch(err){
          setTimeout(() => {
            throw err;
          }, 0);
        }
      }
    };
  }

  const doneTrigger = getTrigger('Done', done, doneCapture);
  const abortTrigger = getTrigger('Abort', abort, abortCapture);
  const loadingTrigger = getTrigger('Loading', loading, loadingCapture);
  const loadTrigger = getTrigger('Load', load, loadCapture);
  const responseTrigger = getTrigger('Response', response, responseCapture);
  const errorTrigger = getTrigger('Error', error, errorCapture);
  const uploadProgressTrigger = getTrigger('UploadProgress', uploadProgress, uploadProgressCapture);
  const downloadProgressTrigger = getTrigger('DownloadProgress', downloadProgress, downloadProgressCapture);
  
  let xhr;

  const unqueue = queue(qcb => {
    var i;

    try {
      xhr = new XMLHttpRequest();

      xhr.onprogress = function({ loaded, total }){
        downloadProgressTrigger({ loaded, total });
      };
  
      if(xhr.upload){
        xhr.upload.onprogress = function({ loaded, total }){
          uploadProgressTrigger({ loaded, total });
        };
      }
  
      xhr.onload = function(){
        var delta,responseURL;
        
        try{
          delta = JSON.parse(xhr.responseText);
        }catch(error){
          xhr = null;
          errorTrigger({ error });
          doneTrigger({ error });
          return;
        }
  
        responseURL = xhr.responseURL || xhr.getResponseHeader('X-Response-Url') || url;
        if (responseURL.indexOf('#') == -1) {
          responseURL += fragment;
        }
  
        xhr = null;
        responseURL = getAbsoluteUrl(responseURL);
        responseTrigger({ responseURL });
  
        apply(delta)(function(error){
          if(error){
            errorTrigger({ error, responseURL });
            doneTrigger({ error, responseURL });
          } else {
            loadTrigger({ responseURL });
            doneTrigger({ responseURL });
          }
        });
      };
  
      xhr.onerror = function(error){
        xhr = null;
        errorTrigger({ error });
        doneTrigger({ error });
      };
      
      const computedHeaders = {};

      computedHeaders['Accept'] = 'application/json';
      computedHeaders['X-Request-ID'] = requestId;
      computedHeaders['X-Requested-With'] = 'XMLHttpRequest';
  
      if (typeof SPH !== 'undefined') {
        const addHeaders = (SPH) => {
          for (i in SPH) if(SPH.hasOwnProperty(i) && SPH[i] != null) {
            if (typeof SPH[i] == 'string') {
              computedHeaders[i] = SPH[i];
            } else if (SPH[i] instanceof Array) {
              SPH[i] = dedupe(SPH[i]);
              computedHeaders[i] = SPH[i].join(', ');
            } else {
              addHeaders(SPH[i]);
            }
          }
        };

        addHeaders(SPH);
      }
  
      for (i in headers) if(headers.hasOwnProperty(i)) {
        computedHeaders[i] = headers[i];
      }

      xhr.open(method, url, true);
  
      for (i in computedHeaders) if(computedHeaders.hasOwnProperty(i)) {
        xhr.setRequestHeader(i, computedHeaders[i]);
      }

      xhr.send(body);
      loadingTrigger({});
    } catch(error) {
      errorTrigger({ error });
      doneTrigger({ error });
    }

    qcb();
  });

  let isAbort = false;

  return () => {
    if (isAbort) {
      return;
    }

    isAbort = true;
    unqueue();

    if (xhr) {
      xhr.onload = xhr.onerror = null;
      xhr.abort();
      xhr = null;
    }

    abortTrigger({});
    doneTrigger({});
  };
}

export default applyURL;
