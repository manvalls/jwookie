import { getAttrList, isTrue, getFirst } from '@vlrz/wc-utils'

export default (BaseClass) => class extends BaseClass {
  static get observedAttributes() {
    return [
      ...(super.observedAttributes || []),
      ...getAttrList('disabled'),
    ]
  }

  attributeChangedCallback(...args) {
    if (super.attributeChangedCallback) {
      super.attributeChangedCallback(...args)
    }

    if (isTrue(getFirst([[this, 'disabled']]))) {
      this.disabled = true
    } else {
      this.disabled = false
    }
  }
}
