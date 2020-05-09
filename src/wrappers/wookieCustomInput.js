import { getAttrList, withInit, getFirst } from '@vlrz/wc-utils'

export default (BaseClass) => withInit(class extends BaseClass {
  static get observedAttributes() {
    return [
      ...(super.observedAttributes || []),
      ...getAttrList('form'),
    ]
  }

  init() {
    this.setAttribute('data-w-custom-input', '')
    this.__wookie_formId = null
  }

  attributeChangedCallback(...args) {
    if (super.attributeChangedCallback) {
      super.attributeChangedCallback(...args)
    }

    const formId = getFirst([[this, 'form']])
    if (this.__wookie_formId != formId) {
      const document = this.ownerDocument
      if (!document) {
        return
      }

      const window = document.defaultView || document.parentWindow
      window.__wookie_customInputs = window.__wookie_customInputs || {}

      if (this.__wookie_formId != null) {
        window.__wookie_customInputs[this.__wookie_formId] = window.__wookie_customInputs[this.__wookie_formId] || new Set()
        window.__wookie_customInputs[this.__wookie_formId].delete(this)
        if (window.__wookie_customInputs[this.__wookie_formId].size === 0) {
          delete window.__wookie_customInputs[this.__wookie_formId]
        }
      }

      if (formId != null) {
        window.__wookie_customInputs[formId] = window.__wookie_customInputs[formId] || new Set()
        window.__wookie_customInputs[formId].add(this)
      }

      this.__wookie_formId = formId
    }
  }
})
