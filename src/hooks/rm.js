import { getControllerAbove, getController, queue, destroyNode } from 'jwit';
import { NoWKHook } from './nowk';
import { getAttr } from '../util';

export class RmHook {
  static attributes = getAttr('rm')

  constructor({ node }) {
    if (getController(node, NoWKHook) || getControllerAbove(node, NoWKHook)) {
      return
    }

    queue(cb => {
      destroyNode(node, () => {
        node.remove()
        cb()
      })
    })
  }
}