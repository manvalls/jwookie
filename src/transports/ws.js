import { apply } from 'jwit';
import getAbsoluteUrl from '../getAbsoluteUrl'
import { toQuery } from '../util';

const sockets = {};
const INACTIVITY_TIMEOUT = 10e3;

function queueOrSend(socket, msg){
  if (socket.ws.readyState === 1) {
    socket.ws.send(msg);
  } else {
    socket.queue.push(msg);
  }
}

function empty(obj) {
  for(let i in obj) if(obj.hasOwnProperty(i)) {
    return false;
  }

  return true;
}

function checkSocket(socket, url){
  if (sockets[url] != socket) {
    return;
  }

  if (empty(socket.context)) {
    clearTimeout(socket.timeout);
    socket.timeout = setTimeout(() => {
      if (sockets[url] != socket) {
        return;
      }

      if (empty(socket.context)) {
        delete sockets[url];
        socket.ws.close();
      }
    }, INACTIVITY_TIMEOUT);
  }
}

function splitByFirst(str, sep){
  const i = str.indexOf(sep);

  if (i == -1) {
    return [str, ''];
  }

  return [str.substring(0, i), str.substring(i + sep.length)]
}

function setupSocket(wsUrl){
  const socket = sockets[wsUrl] = {
    queue: [],
    timeout: null,
    context: {},
    ws: new WebSocket(wsUrl),
  };

  let nextId = 0;
  socket.nextId = () => {
    const id = nextId.toString(36);
    nextId++;
    return id;
  };

  const resolve = (id, error) => {
    if (error && socket == sockets[wsUrl]) {
      clearTimeout(socket.timeout)
      delete sockets[wsUrl];
      socket.ws.close();
    }

    if (socket.context.hasOwnProperty(id)) {
      const { loadTrigger, errorTrigger, doneTrigger, unsubscribeEvents, url: responseURL } = socket.context[id];
      delete socket.context[id];
      checkSocket(socket, wsUrl);
      unsubscribeEvents();

      if(error){
        errorTrigger({ error, responseURL });
      } else {
        loadTrigger({ error, responseURL });
      }

      doneTrigger({ error, responseURL });
    }
  };

  function process(msg){
    let remaining = msg;
    let currentLine = '';
    let key = '';
    let value = '';

    function readLine(){
      const parts = splitByFirst(remaining, '\r\n');
      currentLine = parts[0];
      remaining = parts[1];
    }

    function splitLine(sep){
      const parts = splitByFirst(currentLine, sep);
      key = parts[0];
      value = parts[1];
    }

    readLine();
    splitLine(' ');

    const id = value;

    if (!socket.context.hasOwnProperty(id)) {
      return;
    }

    const context = socket.context[id];

    switch(key){
      case 'RESPONSE':
        readLine();
        const m = currentLine.match(/^(.*?) (.*?)(?: (.*?))?$/);
        const status = parseInt(m[2]);
        const headers = {};
        
        readLine();
        while(currentLine){
          splitLine(':');
          key = key.replace(/\s+/g, ' ').trim().toLowerCase();
          value = value.replace(/\s+/g, ' ').trim();
          headers[key] = headers[key] || [];
          headers[key].push(value);
          readLine();
        }

        if (context.cookiesAllowed && headers['set-cookie']) {
          for(let i = 0; i < headers['set-cookie'].length;i++) {
            document.cookie = headers['set-cookie'][i];
          }
        }
        
        if (headers.location && Math.floor(status / 100) == 3) {
          const location = headers.location[0];
          context.id = socket.nextId();

          if (origin(location)) {
            context.url = location;
          } else if (location.indexOf('/') == 0) {
            context.url = origin(context.url) + location;
          } else {
            context.url = getAbsoluteUrl(context.url.replace(/[^\/]+$/, '') + location);
          }

          if (status == 302 || status == 303) {
            context.method = 'GET';
            context.body = undefined;
          }


          delete socket.context[id];
          socket.context[context.id] = context;
          queueOrSend(socket, `CLOSE ${id}\r\n`);
          makeRequest(context, socket);
          break;
        }

        apply(JSON.parse(remaining))(function(error){
          if(error){
            resolve(id, error);
          }
        });

        break;

      case 'DONE':
        resolve(id);
        break;
      
      case 'APPLY':

        apply(JSON.parse(remaining))(function(error){
          if(error){
            resolve(id, error);
          }
        });

        break;
    }
  }

  socket.ws.onmessage = e => {
    try{
      process(e.data);
    }catch(error){
      socket.ws.onerror(error);
    }
  };

  socket.ws.onerror = error => {
    for(let key in socket.context) {
      resolve(key, error);
    }
  };

  socket.ws.onopen = () => {
    let msg;
    while(msg = socket.queue.shift()){
      socket.ws.send(msg);
    }
  };

  socket.ws.onclose = () => {
    socket.ws.onerror(new Error('Connection closed'));
  };
}

function utf8Bytes(string){
  let total = 0;

  for(let i = 0;i < string.length;i++){
    const code = string.charCodeAt(i);

    if (code <= 0x7f) {
      total++;
    } else if(code <= 0x7ff) {
      total += 2;
    } else if(code <= 0xffff) {
      total += 3;
    } else if(code <= 0x1fffff) {
      total += 4;
    } else if(code <= 0x3ffffff) {
      total += 5;
    } else {
      total += 6;
    }
  }

  return total;
}

function origin(url){
  return (url.replace(/^ws/, 'http').match(/^[a-z]+\:\/\/.*?(?=\/)/) || [])[0];
}

function path(url){
  return url.replace(/^[a-z]+\:\/\/.*?(?=\/)/, '');
}

function makeRequest(context, socket){
  const { id, url, wsUrl, method, body, headers } = context;

  const cookiesAllowed = origin(wsUrl) == origin(url) && origin(wsUrl) == origin(location.href);
  context.cookiesAllowed = cookiesAllowed;

  let request = '';
  request += `REQUEST ${id}\r\n`;
  request += `${method} ${path(url)} HTTP/1.0\r\n`;
  request += `User-Agent: ${navigator.userAgent}\r\n`;
  request += `Referer: ${location.href}\r\n`;
  request += `Origin: ${origin(url)}\r\n`;
  request += `Host: ${origin(url).replace(/^[a-z]+\:\/\//, '')}\r\n`;

  if (cookiesAllowed) {
    request += `Cookie: ${document.cookie}\r\n`
  }

  if (body) {
    request += `Content-Length: ${utf8Bytes(body)}\r\n`;
  }

  for (let i in headers) if (headers.hasOwnProperty(i)) {
    request += `${i}: ${headers[i]}\r\n`
  }

  request += '\r\n'
  if (body) {
    request += body
  }

  queueOrSend(socket, request);
}

export default ({
  errorTrigger,
  doneTrigger,
  loadTrigger,
  responseTrigger,
  method,
  url,
  wsUrl,
  wsEvents,
  headers,
  body,
  fragment,
}) => {
  if (!sockets[wsUrl]) {
    setupSocket(wsUrl)
  }

  const socket = sockets[wsUrl];
  clearTimeout(socket.timeout);
  const id = socket.nextId();

  const context = socket.context[id] = {
    errorTrigger,
    doneTrigger,
    loadTrigger,
    responseTrigger,
    method,
    url,
    wsUrl,
    wsEvents,
    headers,
    body,
    fragment,
    id,
  }

  if (wsEvents) {
    context.unsubscribeEvents = wsEvents.subscribe((data) => {
      let request = '';
      request += `EVENT ${context.id}\r\n`;
      request += toQuery(data);
      queueOrSend(socket, request);
    });
  } else {
    context.unsubscribeEvents = () => {};
  }

  makeRequest(context, socket);

  return () => {
    if (socket.context[context.id] == context) {
      const { unsubscribeEvents } = socket.context[context.id];
      delete socket.context[id];
      checkSocket(socket, wsUrl);
      unsubscribeEvents();
      queueOrSend(socket, `CLOSE ${id}\r\n`);
    }
  };
}