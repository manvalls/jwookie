import { queue } from 'jwit';
import navigate from './navigate';

let session;

try {
  session = window.sessionStorage || {};
} catch(err) {
  session = {};
}

let currentStamp;

function recordScroll(){
  if (!currentStamp) {
    return;
  }

  session['__wookie_' + currentStamp] = JSON.stringify({
    top: document.documentElement.scrollTop || document.body.scrollTop || 0,
    left: document.documentElement.scrollLeft || document.body.scrollLeft || 0,
  });
}

export function historyIsSupported(){
  return typeof history != 'undefined' &&
    history.pushState && history.replaceState &&
    window.addEventListener;
}

export function push(url){
  recordScroll();
  currentStamp = getStamp();
  history.pushState({__wookie: currentStamp}, '', url);
}

export function replace(url){
  const s = history.state || {};
  currentStamp = s.__wookie = s.__wookie || getStamp();
  history.replaceState(s, '', url);
}

function getStamp(){
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(-5);
}

function getRecordedScroll(){
  try {
    return JSON.parse(session['__wookie_' + history.state.__wookie]);
  } catch(err) { }
}

function scroll(s){
  if (!s) {
    return;
  }
  
  window.scrollTo(s.left, s.top);
}

function onPopState(){
  let s;

  if (history.state && history.state.__wookie && history.state.__wookie != currentStamp){
    s = getRecordedScroll();
  }
  
  recordScroll();
  replace(location.href);

  let scrollPrevented = false;

  navigate({
    replace: true,
    headers: { 'X-Popstate': 'true' },
    captureLoad: e => {
      e.preventScroll = () => {
        scrollPrevented = true;
      };
    },
    postLoad: () => {
      if (!scrollPrevented) {
        scroll(s);
      }
    },
  });
}

if (historyIsSupported()) {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  
  if (document.readyState == 'complete') {
    window.addEventListener('popstate', onPopState, false);
  } else {
    window.addEventListener('load', function init(){
      window.removeEventListener('load', init, false);
      setTimeout(function(){
        window.addEventListener('popstate', onPopState, false);
      }, 0);
    }, false);
  }

  function handleExternalChange(){
    replace(location.href);
    recordScroll();
  }

  window.addEventListener('hashchange', function(){
    setTimeout(handleExternalChange, 0);
  }, false);

  window.addEventListener('unload', handleExternalChange, false);
  
  replace(location.href);
  queue(cb => {
    scroll(getRecordedScroll());
    cb();
  });
}
