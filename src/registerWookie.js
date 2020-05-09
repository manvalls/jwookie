import WookieAnchor from './constructors/WookieAnchor'
import WookieButton from './constructors/WookieButton'
import WookieFieldSet from './constructors/WookieFieldSet'
import WookieForm from './constructors/WookieForm'
import WookieInput from './constructors/WookieInput'
import WookieOptGroup from './constructors/WookieOptGroup'
import WookieOption from './constructors/WookieOption'
import WookieScript from './constructors/WookieScript'
import WookieScroll from './constructors/WookieScroll'
import WookieSelect from './constructors/WookieSelect'
import WookieSub from './constructors/WookieSub'
import WookieTextArea from './constructors/WookieTextArea'

export default (prefix = 'w-') => {
  customElements.define(prefix + 'a', WookieAnchor, { extends: 'a' })
  customElements.define(prefix + 'button', WookieButton, { extends: 'button' })
  customElements.define(prefix + 'fieldset', WookieFieldSet, { extends: 'fieldset' })
  customElements.define(prefix + 'form', WookieForm, { extends: 'form' })
  customElements.define(prefix + 'input', WookieInput, { extends: 'input' })
  customElements.define(prefix + 'optgroup', WookieOptGroup, { extends: 'optgroup' })
  customElements.define(prefix + 'option', WookieOption, { extends: 'option' })
  customElements.define(prefix + 'script', WookieScript, { extends: 'script' })
  customElements.define(prefix + 'select', WookieSelect, { extends: 'select' })
  customElements.define(prefix + 'textarea', WookieTextArea, { extends: 'textarea' })

  customElements.define(prefix + 'scroll', WookieScroll)
  customElements.define(prefix + 'sub', WookieSub)
}
