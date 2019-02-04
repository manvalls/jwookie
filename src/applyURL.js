import { queue, getEventTrigger } from 'jwit';
import getAbsoluteUrl from './getAbsoluteUrl';
import { assign, dedupe, toQuery } from './util';

import xhrTransport from './transports/xhr'
import wsTransport from './transports/ws'

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
  var url, wsUrl, wsEvents, fragment, method, headers, body, target;

  options = options || {};

  url = options.url || location.href;
  fragment = (url.match(/#.*$/) || [''])[0];
  url = url.replace(/#.*$/, '');
  url = getAbsoluteUrl(url);
  
  method = options.method || 'GET';
  headers = options.headers || {};
  body = options.body || null;
  target = options.target || null;
  wsEvents = options.wsEvents || null;

  wsUrl = options.wsUrl || null;
  if (wsUrl) {
    wsUrl = getAbsoluteUrl(wsUrl).replace(/^http/, 'ws')
  }

  const requestId = Math.random().toString(36).slice(-10) +
                    Math.random().toString(36).slice(-10) +
                    Date.now().toString(36);
  
  const baseEventData = { url, wsUrl, method, headers, body, target, requestId };

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
  
  let abortReq;

  const unqueue = queue(qcb => {
    var i;

    try {
      const computedHeaders = {};

      computedHeaders['accept'] = 'application/json';
      computedHeaders['x-request-id'] = requestId;
      computedHeaders['x-requested-with'] = 'XMLHttpRequest';
  
      if (typeof SPH !== 'undefined') {
        const addHeaders = (SPH) => {
          var i;

          for (i in SPH) if(SPH.hasOwnProperty(i) && SPH[i] != null) {
            if (typeof SPH[i] == 'string') {
              computedHeaders[i.toLowerCase()] = SPH[i];
            } else if (SPH[i] instanceof Array) {
              SPH[i] = dedupe(SPH[i]);
              computedHeaders[i.toLowerCase()] = SPH[i].join(', ');
            } else if (SPH[i].hasOwnProperty('_map') && SPH[i]._map === true) {
              computedHeaders[i.toLowerCase()] = toQuery(SPH[i]);
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

      loadingTrigger({});

      if (wsUrl) {
        abortReq = wsTransport({
          downloadProgressTrigger,
          uploadProgressTrigger,
          errorTrigger,
          doneTrigger,
          loadTrigger,
          responseTrigger,
          method,
          url,
          wsUrl,
          wsEvents,
          headers: computedHeaders,
          body,
          fragment,
        });
      } else {
        abortReq = xhrTransport({
          downloadProgressTrigger,
          uploadProgressTrigger,
          errorTrigger,
          doneTrigger,
          loadTrigger,
          responseTrigger,
          method,
          url,
          headers: computedHeaders,
          body,
          fragment,
        });
      }
    } catch(error) {
      errorTrigger({ error });
      doneTrigger({ error });
    }

    qcb();
  });

  let isAborted = false;

  return () => {
    if (isAborted) {
      return;
    }

    isAborted = true;
    unqueue();

    if (abortReq) {
      abortReq();
      abortReq = null;
    }

    abortTrigger({});
    doneTrigger({});
  };
}

export default applyURL;
