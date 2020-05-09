import { queueMutex } from 'jwit'
import { isTrue, getFirst } from '@vlrz/wc-utils'

export default (BaseClass) => class extends BaseClass {
  async connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback()
    }

    if (isTrue(getFirst([[this, 'rm']]))) {
      const unlock = await queueMutex.readLock()
      this.remove()
      unlock()
    }
  }
}
