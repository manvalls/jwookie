import { hook } from 'jwit';
import { bind } from '../util';
import { historyIsSupported } from '../urlManager';

function onClick(){
  if (this.form) {
    this.form.__wookie_lastClickedSubmit = this;
  }
}

if (historyIsSupported()) {
  hook('input[type=submit], button[type=submit], input[type=image]', function (input) {
    bind(input, 'click', onClick);
  });
}
