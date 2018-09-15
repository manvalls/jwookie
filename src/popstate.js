import request from './request';

if (
  typeof history != 'undefined' &&
  history.pushState && history.replaceState &&
  window.addEventListener
) {
  window.addEventListener('popstate', function(){
    if (!(history.state && history.state.__wookie)) {
      return;
    }

    request({refresh: true})();
  }, false);

  if (!(history.state && history.state.__wookie)) {
    const st = history.state || {};
    st.__wookie = true;
    history.replaceState(st, '', location.href);
  }
}
