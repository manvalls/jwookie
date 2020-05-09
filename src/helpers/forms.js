import { getFirst, isTrue, getFormElementValues, isSameArray, getFormElements, populateProps, getFormData } from '@vlrz/wc-utils'
import { navigate, applyURL } from 'apply-url'

export function getForm(element) {
  if (!element.hasAttribute('data-w-custom-input')) {
    return element.form
  }

  const document = this.ownerDocument
  if (!document) {
    return null
  }

  const formId = getFirst([[element, 'form']])
  if (formId != null) {
    return document.getElementById(formId)
  }

  let parent = element
  while (parent) {
    if (parent.tagName.toLowerCase() === 'form') {
      return parent
    }

    parent = parent.parentNode
  }

  return null
}

function isLive(element) {
  const form = getForm(element)
  if (!form) {
    return false
  }

  if (!element.hasAttribute('name')) {
    return false
  }

  return isTrue(getFirst([
    [element, 'live'],
    [form, 'live'],
  ]))
}

function waitingForCommit(element) {
  const form = getForm(element)
  if (!form) {
    return false
  }

  return !element.__wookie_committed &&
  (
    isTrue(getFirst([[element, 'aftercommit'], [form, 'aftercommit']])) ||
    isTrue(getFirst([[element, 'commitonly'], [form, 'commitonly']]))
  )
}

function dependencies(element) {
  var deps = getFirst([[element, 'deps']])

  if (deps == null) {
    return []
  }

  return deps.split(/\s+/).map(
    dep => decodeURIComponent(dep)
  ).filter(
    dep => !!dep
  )
}

function liveUpdate(element, debounced) {
  const form = getForm(element)

  if (form.__wookie_waiting) {
    return
  }

  clearTimeout(element.__wookie_debounceTimeout)
  delete element.__wookie_debounceTimeout

  const debounce = getFirst([
    [element, 'debounce'],
    [form, 'debounce'],
  ])

  if (isTrue(debounce) && !debounced) {
    element.__wookie_debounceTimeout = setTimeout(liveUpdate, parseInt(debounce || '0', 10), element, true)
    return
  }

  const values = getFormElementValues(element)
  if (element.__wookie_lastChecked === element.checked && isSameArray(element.__wookie_lastValues, values)) {
    return
  }

  element.__wookie_lastChecked = element.checked
  element.__wookie_lastValues = values

  const toInclude = {}
  const toCheck = {}

  function add(elem, deps) {
    toInclude[elem.getAttribute('name')] = true
    toCheck[elem.getAttribute('name')] = true

    for (const dep of deps) {
      toInclude[dep] = true
    }
  }

  add(element, dependencies(element))

  for (const formElem of getFormElements(form)) {
    if (isLive(formElem) && !waitingForCommit(formElem)) {
      const deps = dependencies(formElem)
      if (isTrue(getFirst([[element, 'dep']])) || deps.indexOf(element.name) != -1) {
        add(formElem, deps)
      }
    }

    if (isTrue(getFirst([[formElem, 'dep']])) && formElem.hasAttribute('name')) {
      toInclude[formElem.getAttribute('name')] = true
    }
  }

  const headers = {}
  headers['X-Live'] = Object.keys(toCheck).join(',')

  populateProps(form, {
    suffix: '-header',
    target: headers,
  })

  populateProps(form, {
    suffix: '-liveheader',
    target: headers,
  })

  const method = getFirst([
    [form, 'livemethod'],
    [form, 'method'],
  ]) || 'GET'

  const url = getFirst([
    [form, 'liveaction'],
    [form, 'action'],
  ]) || location.href

  let whitelist
  if (!isTrue(getFirst([[form, 'includeall']]))) {
    whitelist = Object.keys(toInclude)
  }

  let body
  if (method.toLowerCase() == 'get') {
    body = null
    url = getFormData(form, { url, whitelist })
  } else {
    body = getFormData(form, { whitelist })
  }

  if (element.__wookie_abortController) {
    element.__wookie_abortController.abort()
  }

  let request = applyURL
  if (isTrue(getFirst([[form, 'liveurl']]))) {
    request = navigate
  }

  element.__wookie_abortController = new AbortController()

  request({
    signal: element.__wookie_abortController.signal,
    target: element,
    url,
    headers,
    method,
    body,
    afterDone: () => {
      delete element.__wookie_abortController
    },
  })
}

export function clearInput(element) {
  if (element.__wookie_abortController) {
    element.__wookie_abortController.abort()
    delete element.__wookie_abortController
  }
}

export function inputCommited(element) {
  if (isLive(element)) {
    element.__wookie_committed = true
    liveUpdate(element, false)
  }
}

export function inputChanged(element) {
  if (
    isLive(element) &&
    !isTrue(getFirst([[element, 'commitonly'], [getForm(element), 'commitonly']])) &&
    !waitingForCommit(element)
  ) {
    liveUpdate(element, false)
  }
}
