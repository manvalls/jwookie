import { apply } from 'jwit';
import getAbsoluteUrl from '../getAbsoluteUrl';

export default ({
  downloadProgressTrigger,
  uploadProgressTrigger,
  errorTrigger,
  doneTrigger,
  loadTrigger,
  responseTrigger,
  method,
  url,
  headers,
  body,
  fragment,
}) => {
  let xhr = new XMLHttpRequest();

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

    apply(delta, function(error){
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
  
  xhr.open(method, url, true);

  for (let i in headers) if(headers.hasOwnProperty(i)) {
    xhr.setRequestHeader(i, headers[i]);
  }

  xhr.send(body);

  return () => {
    if (xhr) {
      xhr.onload = xhr.onerror = null;
      xhr.abort();
      xhr = null;
    }
  };
};