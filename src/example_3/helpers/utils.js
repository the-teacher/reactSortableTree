import { abs, min, win, newTag } from './base'
import { _toggleClass, _css, _find } from './css'
import { _dispatchEvent } from './events'

function _cloneHide(sortable, rootEl, cloneEl, dragEl, state) {
  if (sortable.lastPullMode !== 'clone') {
    state = true;
  }

  if (cloneEl && (cloneEl.state !== state)) {
    _css(cloneEl, 'display', state ? 'none' : '')

    if (!state) {
      if (cloneEl.state) {
        if (sortable.options.group.revertClone) {
          // SortableCurrentState.nextEl
          rootEl.insertBefore(cloneEl, nextEl)
          sortable._animate(dragEl, cloneEl)
        } else {
          rootEl.insertBefore(cloneEl, dragEl)
        }
      }
    }

    cloneEl.state = state;
  }
}

// It finds a closes item to a target within a context
// target - target item. Can be a handler item or a draggable item
function _closest(target, selector, ctx) {
  if (target) {
    ctx = ctx || document;

    do {
      if ((selector === '>*' && target.parentNode === ctx) || _matches(target, selector)) {
        return target;
      }
      /* jshint boss:true */
    } while (target = _getParentOrHost(target))
  }

  return null;
}

function _getParentOrHost(el) {
  var parent = el.host;

  return (parent && parent.nodeType) ? parent : el.parentNode;
}

// Browser independent match function
function _matches(el, selector) {
  if (el) {
    try {
      if (el.matches) {
        return el.matches(selector)
      } else if (el.msMatchesSelector) {
        return el.msMatchesSelector(selector)
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
          callback.call(_this, args[0])
        } else {
          callback.apply(_this, args)
        }

        args = void 0;
      }, ms)
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

const _autoScroll = _throttle(function (e, options, rootEl, sortableObj, autoScroll) {
  // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=505521
  if (rootEl && options.scroll) {
    var _this = rootEl.sortableInstance,
      el,
      rect,
      sens = options.scrollSensitivity,
      speed = options.scrollSpeed,

      x = e.clientX,
      y = e.clientY,

      winWidth = window.innerWidth,
      winHeight = window.innerHeight,

      vx,
      vy,

      scrollOffsetX,
      scrollOffsetY
    ;

    // Detect scrollEl
    if (sortableObj.scrollParentEl !== rootEl) {
      var scrollEl = options.scroll;
      sortableObj.scrollParentEl = rootEl;
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
        } while (scrollEl = scrollEl.parentNode)
      }
    }

    if (scrollEl) {
      el = scrollEl;
      rect = scrollEl.getBoundingClientRect()
      vx = (abs(rect.right - x) <= sens) - (abs(rect.left - x) <= sens);
      vy = (abs(rect.bottom - y) <= sens) - (abs(rect.top - y) <= sens);
    }


    if (!(vx || vy)) {
      vx = (winWidth - x <= sens) - (x <= sens);
      vy = (winHeight - y <= sens) - (y <= sens);

      /* jshint expr:true */
      (vx || vy) && (el = win)
    }


    if (autoScroll.vx !== vx || autoScroll.vy !== vy || autoScroll.el !== el) {
      autoScroll.el = el;
      autoScroll.vx = vx;
      autoScroll.vy = vy;

      clearInterval(autoScroll.pid)

      if (el) {
        autoScroll.pid = setInterval(function () {
          scrollOffsetY = vy ? vy * speed : 0;
          scrollOffsetX = vx ? vx * speed : 0;

          if ('function' === typeof(scrollCustomFn)) {
            if (scrollCustomFn.call(_this, scrollOffsetX, scrollOffsetY, e, sortableObj.touchEvt, el) !== 'continue') {
              return;
            }
          }

          if (el === win) {
            win.scrollTo(win.pageXOffset + scrollOffsetX, win.pageYOffset + scrollOffsetY)
          } else {
            el.scrollTop += scrollOffsetY;
            el.scrollLeft += scrollOffsetX;
          }
        }, 24)
      }
    }
  }
}, 30)

function toFn(value, group, pull) {
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
        )
    };
  }
}

const _prepareGroup = function (options) {
  var group = {};
  var originalGroup = options.group;

  if (!originalGroup || typeof originalGroup != 'object') {
    originalGroup = {name: originalGroup};
  }

  group.name = originalGroup.name;
  group.checkPull = toFn(originalGroup.pull, group, true)
  group.checkPut = toFn(originalGroup.put, group)
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

function _nextTick(fn) {
  return setTimeout(fn, 0)
}

function _cancelNextTick(id) {
  return clearTimeout(id)
}

function _generateId(el) {
  var str = el.tagName + el.className + el.src + el.href + el.textContent,
    i = str.length,
    sum = 0;

  while (i--) {
    sum += str.charCodeAt(i)
  }

  return sum.toString(36)
}

function _index(el, selector) {
  var index = 0;

  if (!el || !el.parentNode) {
    return -1;
  }

  while (el && (el = el.previousElementSibling)) {
    if ((el.nodeName.toUpperCase() !== 'TEMPLATE') && (selector === '>*' || _matches(el, selector))) {
      index++;
    }
  }

  return index;
}

function _globalDragOver(e) {
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  e.preventDefault()
}

function _disableDraggable(el) {
  el.draggable = false;
}

function getFirstSortableParent (el) {
  if (el.sortableInstance) return el
  var sortableParent = null

  while (el) {
    if (el.sortableInstance) {
      sortableParent = el
      break
    }

    el = el.parentElement
  }

  return el
}

// Disable "draggable" functionality for specific tags
// "a, img" by default
function disableDraggableForSpecificTags (ignoreTags, sortableStateObj) {
  ignoreTags.split(',').forEach(function (criteria) {
    _find(sortableStateObj.draggableItem, criteria.trim(), _disableDraggable)
  })
}

function setupSotrableStateObject(sortableStateObj, e, el, target, group, startIndex) {
  sortableStateObj.tapEvt = e;
  sortableStateObj.rootEl = el;
  sortableStateObj.draggableItem = target;
  sortableStateObj.parentEl = sortableStateObj.draggableItem.parentNode;
  sortableStateObj.nextEl = sortableStateObj.draggableItem.nextSibling;
  sortableStateObj.lastDownEl = target;
  sortableStateObj.activeGroup = group;
  sortableStateObj.oldIndex = startIndex;
  sortableStateObj.draggableItem.style['will-change'] = 'all';
}

export {
  _cloneHide,
  _closest,
  _getParentOrHost,
  _matches,
  _throttle,
  _extend,
  _autoScroll,
  _prepareGroup,
  supportCssPointerEvents,
  _nextTick,
  _cancelNextTick,
  _generateId,
  _index,
  _globalDragOver,
  _disableDraggable,
  getFirstSortableParent,
  disableDraggableForSpecificTags,
  setupSotrableStateObject
}
