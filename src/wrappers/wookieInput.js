import { withInit } from '@vlrz/wc-utils'
import { clearInput, inputCommited, inputChanged } from '../helpers/forms'

export default (BaseClass) => withInit(class extends BaseClass {
  init() {
    this.addEventListener('change', () => inputCommited(this))
    this.addEventListener('blur', () => inputCommited(this))
    this.addEventListener('input', () => inputChanged(this))
  }

  disconnectedCallback() {
    clearInput(this)
  }
})
