import { hook } from 'jwit';
import { bind } from '../util';

function onClick(){
  if (this.form) {
    this.form.__wookie_lastClickedSubmit = this;
  }
}

hook('input[type=submit], button[type=submit], input[type=image]', function(input){
  bind(input, 'click', onClick);
});
