function _cloneHide(sortable, cloneEl, state) {
  if (sortable.lastPullMode !== 'clone') {
    state = true;
  }

  if (cloneEl && (cloneEl.state !== state)) {
    _css(cloneEl, 'display', state ? 'none' : '');

    if (!state) {
      if (cloneEl.state) {
        if (sortable.options.group.revertClone) {
          rootEl.insertBefore(cloneEl, nextEl);
          sortable._animate(dragEl, cloneEl);
        } else {
          rootEl.insertBefore(cloneEl, dragEl);
        }
      }
    }

    cloneEl.state = state;
  }
}

function _closest(/**HTMLElement*/el, /**String*/selector, /**HTMLElement*/ctx) {
  if (el) {
    ctx = ctx || document;

    do {
      if ((selector === '>*' && el.parentNode === ctx) || _matches(el, selector)) {
        return el;
      }
      /* jshint boss:true */
    } while (el = _getParentOrHost(el));
  }

  return null;
}

function _getParentOrHost(el) {
  var parent = el.host;

  return (parent && parent.nodeType) ? parent : el.parentNode;
}

function _matches(/**HTMLElement*/el, /**String*/selector) {
  if (el) {
    try {
      if (el.matches) {
        return el.matches(selector);
      } else if (el.msMatchesSelector) {
        return el.msMatchesSelector(selector);
      }
    } catch(_) {
      return false;
    }
  }

  return false;
}

function _throttle(callback, ms) {
  var args, _this;

  return function () {
    if (args === void 0) {
      args = arguments;
      _this = this;

      setTimeout(function () {
        if (args.length === 1) {
          callback.call(_this, args[0]);
        } else {
          callback.apply(_this, args);
        }

        args = void 0;
      }, ms);
    }
  };
}

function _extend(dst, src) {
  if (dst && src) {
    for (var key in src) {
      if (src.hasOwnProperty(key)) {
        dst[key] = src[key];
      }
    }
  }

  return dst;
}

module.exports = {
  _cloneHide: _cloneHide,
  _closest: _closest,
  _getParentOrHost: _getParentOrHost,
  _matches: _matches,
  _throttle: _throttle,
  _extend: _extend
}
