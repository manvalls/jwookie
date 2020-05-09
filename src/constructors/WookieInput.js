import { compose } from '@vlrz/wc-utils'
import wookieDisableable from '../wrappers/wookieDisableable'
import wookieFocusable from '../wrappers/wookieFocusable'
import wookieSubmit from '../wrappers/wookieSubmit'
import wookieInput from '../wrappers/wookieInput'

export default compose(
  wookieDisableable,
  wookieFocusable,
  wookieSubmit,
  wookieInput
)(HTMLInputElement)
