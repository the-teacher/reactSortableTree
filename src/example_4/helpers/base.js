const raiseExceptionIfNotBrowserEnvironment = () => {
  const NotBrowserEnv = typeof window === 'undefined' || !window.document
  if (NotBrowserEnv) throw new Error('Sortable.js requires a window with a document')
}

const detectSupportActiveMode = () => {
  try {
    window.addEventListener('test', null, Object.defineProperty({}, 'passive', {
      get: function () {
        // `false`, because everything starts to work incorrectly and instead of d'n'd,
        // begins the page has scrolled.
        passiveMode = false;
        captureMode = {
          capture: false,
          passive: passiveMode
        };
      }
    }))
  } catch (err) {}
}

const htmlElementIsRequired = (el) => {
  if (!(el && el.nodeType && el.nodeType === 1)) {
    throw 'Sortable: `el` must be HTMLElement, and not ' + {}.toString.call(el)
  }
}

const R_SPACE = /\s+/g
const R_FLOAT = /left|right|inline/

const win = window
const doc = document

const abs = Math.abs
const min = Math.min

const toInt = (val) => win.parseInt(val, 10)
const setTimeout = win.setTimeout

const newTag = (name) => doc.createElement(name)

// UI Lib specific
const $ = win.jQuery || win.Zepto
const Polymer = win.Polymer

const clone = (el) => {
  if (Polymer && Polymer.dom) { return Polymer.dom(el).cloneNode(true) }
  else if ($) { return $(el).clone(true)[0] }
  else { return el.cloneNode(true) }
}

export {
  win,
  doc,

  abs,
  min,

  raiseExceptionIfNotBrowserEnvironment,
  detectSupportActiveMode,
  htmlElementIsRequired,

  clone,
  toInt,
  setTimeout,
  newTag,

  R_SPACE,
  R_FLOAT
}
