import { doc } from './base'

function _toggleClass(el, name, state) {
  if (el) {
    if (el.classList) {
      el.classList[state ? 'add' : 'remove'](name)
    }
    else {
      var className = (' ' + el.className + ' ').replace(R_SPACE, ' ').replace(' ' + name + ' ', ' ')
      el.className = (className + (state ? ' ' + name : '')).replace(R_SPACE, ' ')
    }
  }
}

function _css(el, prop, val) {
  var style = el && el.style;

  if (style) {
    if (val === void 0) {
      if (doc.defaultView && doc.defaultView.getComputedStyle) {
        val = doc.defaultView.getComputedStyle(el, '')
      }
      else if (el.currentStyle) {
        val = el.currentStyle;
      }

      return prop === void 0 ? val : val[prop];
    }
    else {
      if (!(prop in style)) {
        prop = '-webkit-' + prop;
      }

      style[prop] = val + (typeof val === 'string' ? '' : 'px')
    }
  }
}

function _find(ctx, tagName, iterator) {
  if (ctx) {
    var list = ctx.getElementsByTagName(tagName), i = 0, n = list.length;

    if (iterator) {
      for (; i < n; i++) {
        iterator(list[i], i)
      }
    }

    return list;
  }

  return [];
}

export {
  _toggleClass,
  _css,
  _find
}
