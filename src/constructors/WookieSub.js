import wookieRemovable from '../wrappers/wookieRemovable'
import { getFirst, populateProps } from '@vlrz/wc-utils'
import { applyURL } from 'apply-url'

// TODO: recreate the connection when attributes change

const RETRY_TIMEOUT = 2e3

class WookieSub extends HTMLElement {

  connectedCallback() {
    const document = this.ownerDocument
    if (!document) {
      return
    }

    const window = document.defaultView || document.parentWindow
    this.abortController = new AbortController()
    const subscription = getFirst([[this, 'sub']])

    const subscribe = () => {
      applyURL({
        signal: this.abortController.signal,
        target: this,
        wsUrl: getFirst([[this, 'sub-url']]) || window.wsubURL || '/witsub',
        headers: populateProps(this, { suffix: '-sub-header', target: { 'X-Wok-Call': subscription } }),
        afterError: () => {
          if (getFirst([[this, 'sub-retry']]) != 'never') {
            setTimeout(subscribe, RETRY_TIMEOUT)
          }
        },
        afterLoad: () => {
          if (getFirst([[this, 'sub-retry']]) == 'always') {
            setTimeout(subscribe, RETRY_TIMEOUT)
          }
        },
      })
    }

    subscribe()
  }

  disconnectedCallback() {
    this.abortController.abort()
  }

}

export default wookieRemovable(WookieSub)
