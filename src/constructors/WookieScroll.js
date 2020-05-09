import wookieRemovable from '../wrappers/wookieRemovable'
import { getFirst } from '@vlrz/wc-utils'

class WookieScroll extends HTMLElement {

  connectedCallback() {
    const document = this.ownerDocument
    if (!document) {
      return
    }

    const window = document.defaultView || document.parentWindow
    const top = getFirst([[this, 'scroll-top'], [this, 'top']])
    const bottom = getFirst([[this, 'scroll-bottom'], [this, 'bottom']])
    const left = getFirst([[this, 'scroll-left'], [this, 'left']])
    const right = getFirst([[this, 'scroll-right'], [this, 'right']])
    const targetSelector = getFirst([[this, 'scroll-target'], [this, 'target']])

    const behavior = getFirst([[this, 'scroll-behavior'], [this, 'behavior']]) || 'auto'
    const block = getFirst([[this, 'scroll-block'], [this, 'block']]) || 'start'
    const inline = getFirst([[this, 'scroll-inline'], [this, 'inline']]) || 'nearest'

    if (top != null || bottom != null || left != null || right != null) {
      // From https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY

      const supportPageOffset = window.pageXOffset !== undefined
      const isCSS1Compat = ((document.compatMode || '') === 'CSS1Compat')
      const scrollX = supportPageOffset ? window.pageXOffset : isCSS1Compat ? document.documentElement.scrollLeft : document.body.scrollLeft
      const scrollY = supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop

      // From jquery

      function getWidth() {
        return Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.offsetWidth,
          document.documentElement.clientWidth
        )
      }

      function getHeight() {
        return Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.documentElement.clientHeight
        )
      }

      // From stackoverflow

      const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
      const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

      let x, y

      if (top != null) {
        if (!top) {
          y = 0
        } else if (top == 'center') {
          y = getHeight() / 2 - h / 2
        } else {
          y = parseInt(top)
        }
      } else if (bottom != null) {
        if (!bottom) {
          y = getHeight()
        } else if (bottom == 'center') {
          y = getHeight() / 2 - h / 2
        } else {
          y = getHeight() - parseInt(bottom)
        }
      } else {
        y = scrollY
      }

      if (left != null) {
        if (!left) {
          x = 0
        } else if (left == 'center') {
          x = getWidth() / 2 - w / 2
        } else {
          x = parseInt(left)
        }
      } else if (right != null) {
        if (!right) {
          x = getWidth()
        } else if (right == 'center') {
          x = getWidth() / 2 - w / 2
        } else {
          x = getWidth() - parseInt(right)
        }
      } else {
        x = scrollX
      }

      if (behavior == 'auto') {
        window.scrollTo(x, y)
      } else {
        window.scrollTo({ left: x, top: y, behavior })
      }

      return
    }

    let target = this
    if (targetSelector) {
      target = document.querySelector(targetSelector)
    }

    if (!target) {
      return
    }

    let arg = true
    if (behavior == 'auto' && block == 'end' && inline == 'nearest') {
      arg = false
    } else if (behavior != 'auto' && block != 'start' && inline != 'nearest') {
      arg = { behavior, block, inline }
    }

    target.scrollIntoView(arg)
  }

}

export default wookieRemovable(WookieScroll)
