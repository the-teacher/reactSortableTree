import { abs, min, win, newTag } from './base'
import { _css } from './css'

function _cloneHide(sortable, rootEl, cloneEl, dragEl, state) {
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

const _autoScroll = _throttle(function (/**Event*/evt, /**Object*/options, /**HTMLElement*/rootEl, scrollParentEl, autoScroll) {
  // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
  if (rootEl && options.scroll) {
    var _this = rootEl.sortableInstance,
      el,
      rect,
      sens = options.scrollSensitivity,
      speed = options.scrollSpeed,

      x = evt.clientX,
      y = evt.clientY,

      winWidth = window.innerWidth,
      winHeight = window.innerHeight,

      vx,
      vy,

      scrollOffsetX,
      scrollOffsetY
    ;

    // Delect scrollEl
    if (scrollParentEl !== rootEl) {
      var scrollEl = options.scroll;
      scrollParentEl = rootEl;
      var scrollCustomFn = options.scrollFn;

      if (scrollEl === true) {
        scrollEl = rootEl;

        do {
          if ((scrollEl.offsetWidth < scrollEl.scrollWidth) ||
            (scrollEl.offsetHeight < scrollEl.scrollHeight)
          ) {
            break;
          }
          /* jshint boss:true */
        } while (scrollEl = scrollEl.parentNode);
      }
    }

    if (scrollEl) {
      el = scrollEl;
      rect = scrollEl.getBoundingClientRect();
      vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
      vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
    }


    if (!(vx || vy)) {
      vx = (winWidth - x <= sens) - (x <= sens);
      vy = (winHeight - y <= sens) - (y <= sens);

      /* jshint expr:true */
      (vx || vy) && (el = win);
    }


    if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
      autoScroll.el = el;
      autoScroll.vx = vx;
      autoScroll.vy = vy;

      clearInterval(autoScroll.pid);

      if (el) {
        autoScroll.pid = setInterval(function () {
          scrollOffsetY = vy ? vy * speed : 0;
          scrollOffsetX = vx ? vx * speed : 0;

          if ('function' === typeof(scrollCustomFn)) {
            if (scrollCustomFn.call(_this, scrollOffsetX, scrollOffsetY, evt, touchEvt, el) !== 'continue') {
              return;
            }
          }

          if (el === win) {
            win.scrollTo(win.pageXOffset + scrollOffsetX, win.pageYOffset + scrollOffsetY);
          } else {
            el.scrollTop += scrollOffsetY;
            el.scrollLeft += scrollOffsetX;
          }
        }, 24);
      }
    }
  }
}, 30)

const _prepareGroup = function (options) {
  function toFn(value, pull) {
    if (value == null || value === true) {
      value = group.name;
      if (value == null) {
        return (function () { return false })
      }
    }

    if (typeof value === 'function') {
      return value;
    } else {
      return function (to, from) {
        var fromGroup = from.options.group.name;

        return pull
          ? value
          : value && (value.join
            ? value.indexOf(fromGroup) > -1
            : (fromGroup == value)
          );
      };
    }
  }

  var group = {};
  var originalGroup = options.group;

  if (!originalGroup || typeof originalGroup != 'object') {
    originalGroup = {name: originalGroup};
  }

  group.name = originalGroup.name;
  group.checkPull = toFn(originalGroup.pull, true);
  group.checkPut = toFn(originalGroup.put);
  group.revertClone = originalGroup.revertClone;

  options.group = group;
}

const supportCssPointerEvents = (function (el) {
  // false when IE11
  if (!!navigator.userAgent.match(/(?:Trident.*rv[ :]?11\.|msie)/i)) {
    return false;
  }
  el = newTag('x')
  el.style.cssText = 'pointer-events:auto';
  return el.style.pointerEvents === 'auto';
})()

export {
  _cloneHide,
  _closest,
  _getParentOrHost,
  _matches,
  _throttle,
  _extend,
  _autoScroll,
  _prepareGroup,
  supportCssPointerEvents
}
