import { withInit } from '@vlrz/wc-utils'

function onClick() {
  if (this.tagName.toLowerCase() == 'input' && this.type != 'submit' && this.type != 'image') {
    return
  }

  if (this.form) {
    this.form.__wookie_lastClickedSubmit = this
  }
}

export default (BaseClass) => withInit(class extends BaseClass {
  init() {
    this.addEventListener('click', onClick)
  }
})
