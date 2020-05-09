import { isTrue, getFirst } from '@vlrz/wc-utils'

export default (BaseClass) => class extends BaseClass {
  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback()
    }

    if (isTrue(getFirst([[this, 'autofocus']]))) {
      this.focus()
    }
  }
}
