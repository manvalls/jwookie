import { compose } from '@vlrz/wc-utils'
import wookieDisableable from '../wrappers/wookieDisableable'
import wookieFocusable from '../wrappers/wookieFocusable'
import wookieSubmit from '../wrappers/wookieSubmit'

export default compose(
  wookieDisableable,
  wookieFocusable,
  wookieSubmit
)(HTMLButtonElement)
