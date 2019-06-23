import { bind } from '../util';
import { historyIsSupported } from '../urlManager';
import { getControllerAbove, getController } from 'jwit';
import { NoWKHook } from './nowk';

function onClick(){
  if (this.tagName.toLowerCase() == 'input' && this.type != 'submit' && this.type != 'image') {
    return
  }

  if (this.form) {
    this.form.__wookie_lastClickedSubmit = this;
  }
}

export class SubmitHook {
  static elements = ['input', 'button']

  static shouldHook() {
    return historyIsSupported()
  }

  constructor({ node }) {
    if (getController(node, NoWKHook) || getControllerAbove(node, NoWKHook)) {
      return
    }

    bind(node, 'click', onClick)
  }
}
