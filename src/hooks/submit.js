import { hook, wrapFactory } from 'jwit';
import { bind } from '../util';
import { historyIsSupported } from '../urlManager';

function onClick(){
  if (this.form) {
    this.form.__wookie_lastClickedSubmit = this;
  }
}

export default wrapFactory(() => {
  if (historyIsSupported()) {
    return [hook('input[type=submit], button[type=submit], input[type=image]', function (input) {
      bind(input, 'click', onClick);
    })];
  }

  return [];
});
