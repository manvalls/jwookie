import { isNotSelf, getFirst, isTrue, populateProps, withInit } from '@vlrz/wc-utils'
import createLink from 'create-link'
import { navigate } from 'apply-url'

function onClick(e) {
  var headers = {}

  if (isNotSelf(getFirst([[this, 'target']]))) {
    return
  }

  const url = getFirst([[this, 'href']])
  const link = createLink(url)

  if (url && (link.origin != location.origin)) {
    return
  }

  if (
    url &&
    !isTrue(getFirst([[this, 'force']])) &&
    url.match(/#.*$/) &&
    location.href.replace(/#.*$/, '') == link.href.replace(/#.*$/, '')
  ) {
    return
  }

  e.preventDefault()

  if (!isTrue(getFirst([[this, 'nodebounce']])) && this.__wookie_waiting) {
    return
  }

  this.__wookie_waiting = true
  populateProps(this, { suffix: '-header', target: headers })

  navigate({
    target: this,
    url,
    headers,
    afterDone: () => {
      delete this.__wookie_waiting
    },
  })
}

export default (BaseClass) => withInit(class extends BaseClass {
  init() {
    this.addEventListener('click', onClick)
  }
})
