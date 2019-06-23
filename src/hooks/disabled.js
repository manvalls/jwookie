import { getControllerAbove, getController } from 'jwit';
import { NoWKHook } from './nowk';
import { getAttr, isTrue, getFirst } from '../util';

export class DisabledHook {
  static attributes = getAttr('disabled')

  constructor({ node }) {
    if (getController(node, NoWKHook) || getControllerAbove(node, NoWKHook)) {
      return
    }

    this.onAttrChange = () => {
      if (isTrue(getFirst([[node, 'disabled']]))) {
        node.disabled = true
      } else {
        node.disabled = false
      }
    }

    this.onDestroy = () => {
      node.disabled = false
    }

    this.onAttrChange()
  }
}