import { withInit, isNotSelf, getFirst, isTrue, getFormData, populateProps, getFormElements } from '@vlrz/wc-utils'
import createLink from 'create-link'
import { navigate } from 'apply-url'
import { clearInput } from '../helpers/forms'

function onSubmit(e) {
  var headers = {}
  var clickedSubmit = this.__wookie_lastClickedSubmit
  var url, body, method

  if (isNotSelf(getFirst([
    [clickedSubmit, 'formtarget'],
    [this, 'target'],
  ]))) {
    return
  }

  populateProps(this, {
    target: headers,
    suffix: '-header',
  })

  if (clickedSubmit) {
    populateProps(clickedSubmit, {
      target: headers,
      suffix: '-header',
    })
  }

  method = getFirst([
    [clickedSubmit, 'formmethod'],
    [this, 'method'],
  ]) || 'GET'

  url = getFirst([
    [clickedSubmit, 'formaction'],
    [this, 'action'],
  ]) || location.href

  if (createLink(url).origin != location.origin) {
    return
  }

  if (method.toLowerCase() == 'get') {
    body = null
    url = getFormData(this, { url, submitter: clickedSubmit })
  } else {
    body = getFormData(this, { submitter: clickedSubmit })
  }

  e.preventDefault()
  if (!isTrue(getFirst([
    [clickedSubmit, 'nodebounce'],
    [this, 'nodebounce'],
  ])) && this.__wookie_waiting) {
    return
  }

  this.__wookie_waiting = true
  for (const element of getFormElements(this)) {
    clearInput(element)
  }

  navigate({
    target: this,
    url,
    headers,
    method,
    body,
    afterDone: () => {
      delete this.__wookie_waiting
    },
  })
}

export default (BaseClass) => withInit(class extends BaseClass {
  init() {
    this.addEventListener('submit', onSubmit)
  }

  getCustomInputs() {
    const customInputs = []

    const document = this.ownerDocument
    if (!document) {
      return []
    }

    const window = document.defaultView || document.parentWindow

    if (this.id) {
      for (const element of (window.__wookie_customInputs || {})[this.id] || new Set()) {
        customInputs.push(element)
      }
    }

    for (const element of this.querySelectorAll('[data-w-custom-input]:not([form]):not([w-form]):not([data-w-form])')) {
      customInputs.push(element)
    }

    return customInputs
  }
})
