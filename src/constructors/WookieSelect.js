import { compose } from '@vlrz/wc-utils'
import wookieDisableable from '../wrappers/wookieDisableable'
import wookieFocusable from '../wrappers/wookieFocusable'

export default compose(
  wookieDisableable,
  wookieFocusable
)(HTMLSelectElement)
