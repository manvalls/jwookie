import applyURL from './applyURL';
import { assign } from './utils';
import getAbsoluteUrl from './getAbsoluteUrl';
import { push, replace, historyIsSupported } from './urlManager';

let cancelLastRequest;

function navigate(options){
  options = options || {};

  if (cancelLastRequest) {
    cancelLastRequest();
  }

  let reloadPrevented = false;
  let fragmentNavigationPrevented = false;
  let URLChangePrevented = false;
  let responseURL;

  cancelLastRequest = applyURL(assign({}, options, {
    headers: assign({
      'X-Navigation': 'true',
    }, options.headers || {}),

    captureResponse: e => {
      e.preventURLChange = () => {
        URLChangePrevented = true;
      };

      if(typeof options.captureResponse == 'function'){
        options.captureResponse(e);
      }
    },

    postResponse: ({ responseURL }) => {
      if(
        !URLChangePrevented &&
        historyIsSupported() &&
        responseURL != location.href
      ){
        if (options.replace) {
          replace(responseURL);
        } else {
          push(responseURL);
        }
      }

      if(typeof options.postResponse == 'function'){
        options.postResponse();
      }
    },

    captureLoad: e => {
      e.preventFragmentNavigation = () => {
        fragmentNavigationPrevented = true;
      };

      if(typeof options.captureLoad == 'function'){
        options.captureLoad(e);
      }
    },

    postLoad: () => {
      cancelLastRequest = null;

      if(!fragmentNavigationPrevented && location.hash){
        location.hash = location.hash;
      }

      if(typeof options.postLoad == 'function'){
        options.postLoad();
      }
    },

    captureError: e => {
      responseURL = e.responseURL;

      e.preventReload = () => {
        reloadPrevented = true;
      };

      if(typeof options.captureError == 'function'){
        options.captureError(e);
      }
    },

    postError: () => {
      if (!reloadPrevented) {
        if (responseURL) {
          location.href = responseURL;
        } else {
          location.href = options.url || location.href;
        }
      }

      if(typeof options.postError == 'function'){
        options.postError();
      }
    },
  }));

  return cancelLastRequest;
}

export function abortNavigation(){
  if (cancelLastRequest) {
    cancelLastRequest();
  }
}

export default navigate;
