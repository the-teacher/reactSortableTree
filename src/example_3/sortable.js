// * Sortable
// * @author  RubaXa   <trash@rubaxa.org>
// * @license MIT

// _onTapStart
// _prepareDragStart
// _disableDelayedDrag
// _onTapStart
// _onDragStart
// _offUpEvents
// _dragStarted
// _nulling
// handleEvent
// (25)handleEvent
// _onDragOver
// _onDrop
// _offUpEvents
// _nulling

// Mobile version
// Tap events. Scrolling to top for small screens was broken somewhere
// TODO: MUST BE CHECKED AND FIXED

import {
  log
} from '../shared/helpers'

import {
  win, doc,
  abs, min,

  raiseExceptionIfNotBrowserEnvironment,
  detectSupportActiveMode,
  htmlElementIsRequired,

  clone,
  toInt,
  setTimeout,
  newTag,

  R_SPACE,
  R_FLOAT
} from './helpers/base'

import {
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
  _disableDraggable
} from './helpers/utils'

import {
  _toggleClass,
  _css,
  _find
} from './helpers/css'

import {
  _on,
  _off,
  _dispatchEvent
} from './helpers/events'

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

const Sortable = (function () {
  'use strict';

  raiseExceptionIfNotBrowserEnvironment()

  var
    touchDragOverListeners = []
  ;

  // Implementation functions
  function _defineImplementationMethods () {
    this.handleEvent = function (e) {
      switch (e.type) {
        case 'drop':
        case 'dragend':
          this._onDrop(e)
          break;

        case 'dragover':
        case 'dragenter':
          var el = getFirstSortableParent(e.target)

          if (Sortable.draggableItem) {
            this._onDragOver(e)
            _globalDragOver(e)
          }
          break;

        case 'mouseover':
          this._onDrop(e)
          break;

        case 'selectstart':
          e.preventDefault()
          break;
      }
    }

    this._prepareDragStart = function (e, touch, target, startIndex) {
      // Sortable root
      var el = getFirstSortableParent(e.target)

      // target => handler item or draggable element

      var _this = this,
        options = _this.options,
        ownerDocument = el.ownerDocument,
        dragStartFn;

      if (target && !Sortable.draggableItem && (target.parentNode === el)) {
        Sortable.tapEvt = e;

        Sortable.rootEl = el;
        Sortable.draggableItem = target;
        Sortable.parentEl = Sortable.draggableItem.parentNode;
        Sortable.nextEl = Sortable.draggableItem.nextSibling;
        Sortable.lastDownEl = target;
        Sortable.activeGroup = options.group;
        Sortable.oldIndex = startIndex;

        this._lastX = (touch || e).clientX;
        this._lastY = (touch || e).clientY;

        Sortable.draggableItem.style['will-change'] = 'all';

        dragStartFn = function () {
          // Delayed drag has been triggered
          // we can re-enable the events: touchmove/mousemove
          _this._disableDelayedDrag()

          // Make the element draggable
          Sortable.draggableItem.draggable = _this.nativeDraggable;

          // Chosen item
          _toggleClass(Sortable.draggableItem, options.chosenClass, true)

          // Bind the events: dragstart/dragend
          _this._triggerDragStart(e, touch, Sortable.rootEl, Sortable.draggableItem)

          // Drag start event
          _dispatchEvent(_this, Sortable.rootEl, Sortable.cloneEl, 'choose', Sortable.draggableItem, Sortable.rootEl, Sortable.rootEl, Sortable.oldIndex)
        };

        // Disable "draggable"
        options.ignore.split(',').forEach(function (criteria) {
          _find(Sortable.draggableItem, criteria.trim(), _disableDraggable)
        })

        _on(ownerDocument, 'mouseup', _this._onDrop)
        _on(ownerDocument, 'touchend', _this._onDrop)
        _on(ownerDocument, 'touchcancel', _this._onDrop)
        _on(ownerDocument, 'selectstart', _this)
        options.supportPointer && _on(ownerDocument, 'pointercancel', _this._onDrop)

        if (options.delay) {
          // If the user moves the pointer or let go the click or touch
          // before the delay has been reached:
          // disable the delayed drag
          _on(ownerDocument, 'mouseup', _this._disableDelayedDrag)
          _on(ownerDocument, 'touchend', _this._disableDelayedDrag)
          _on(ownerDocument, 'touchcancel', _this._disableDelayedDrag)
          _on(ownerDocument, 'mousemove', _this._disableDelayedDrag)
          _on(ownerDocument, 'touchmove', _this._delayedDragTouchMoveHandler)
          options.supportPointer && _on(ownerDocument, 'pointermove', _this._delayedDragTouchMoveHandler)

          _this._dragStartTimer = setTimeout(dragStartFn, options.delay)
        } else {
          dragStartFn()
        }
      }
    }
    this._onTapStart = function (e) {
      var _this = this;

      // Sortable root
      var el = getFirstSortableParent(e.target)

      // Defite a touch event
      var touch = e.touches && e.touches[0];

      // Define a target. A handler item of a draggable item
      var target = (touch || e).target;
      var originalTarget = e.target.shadowRoot && (e.path && e.path[0]) || target;

      var
        startIndex,
        type = e.type,
        options = this.options,
        filter = options.filter,
        preventOnFilter = options.preventOnFilter;

      this._saveInputCheckedState(el)

      // Don't trigger start event when an element is been dragged, otherwise the e.oldindex always wrong when set option.group.
      if (Sortable.draggableItem) {
        return;
      }

      if (/mousedown|pointerdown/.test(type) && e.button !== 0 || options.disabled) {
        return; // only left button or enabled
      }

      // cancel dnd if original target is content editable
      if (originalTarget.isContentEditable) {
        return;
      }

      // define draggable Element
      target = _closest(target, options.draggable, el)

      if (!target) {
        return;
      }

      if (Sortable.lastDownEl === target) {
        // Ignoring duplicate `down`
        return;
      }

      // Get the index of the dragged element within its parent
      startIndex = _index(target, options.draggable)

      // Check filter
      if (typeof filter === 'function') {
        if (filter.call(this, e, target, this)) {
          _dispatchEvent(_this, originalTarget, Sortable.cloneEl, 'filter', target, el, el, startIndex)
          preventOnFilter && e.preventDefault()
          return; // cancel dnd
        }
      }
      else if (filter) {
        filter = filter.split(',').some(function (criteria) {
          criteria = _closest(originalTarget, criteria.trim(), el)

          if (criteria) {
            _dispatchEvent(_this, criteria, Sortable.cloneEl, 'filter', target, el, el, startIndex)
            return true;
          }
        })

        if (filter) {
          preventOnFilter && e.preventDefault()
          return; // cancel dnd
        }
      }

      if (options.handle && !_closest(originalTarget, options.handle, el)) {
        return;
      }

      // Prepare `dragstart`
      this._prepareDragStart(e, touch, target, startIndex)
    }
    this._delayedDragTouchMoveHandler = function (e) {
      if (min(abs(e.clientX - this._lastX), abs(e.clientY - this._lastY)) >= this.options.touchStartThreshold) {
        this._disableDelayedDrag()
      }
    }
    this._disableDelayedDrag = function () {
      var ownerDocument = this.el.ownerDocument;

      clearTimeout(this._dragStartTimer)
      _off(ownerDocument, 'mouseup', this._disableDelayedDrag)
      _off(ownerDocument, 'touchend', this._disableDelayedDrag)
      _off(ownerDocument, 'touchcancel', this._disableDelayedDrag)
      _off(ownerDocument, 'mousemove', this._disableDelayedDrag)
      _off(ownerDocument, 'touchmove', this._disableDelayedDrag)
      _off(ownerDocument, 'pointermove', this._disableDelayedDrag)
    }
    this._dragStarted = function (e) {
      var el = getFirstSortableParent(e.target)

      if (Sortable.rootEl && Sortable.draggableItem) {
        var options = this.options;

        // Apply effect
        _toggleClass(Sortable.draggableItem, options.ghostClass, true)
        _toggleClass(Sortable.draggableItem, options.dragClass, false)

        Sortable.activeSortableItem = this;

        // Drag start event
        _dispatchEvent(this, Sortable.rootEl, Sortable.cloneEl, 'start', Sortable.draggableItem, Sortable.rootEl, Sortable.rootEl, Sortable.oldIndex)
      } else {
        this._nulling(e)
      }
    }
    this._emulateDragOver = function () {
      if (Sortable.touchEvt) {
        if (this._lastX === Sortable.touchEvt.clientX && this._lastY === Sortable.touchEvt.clientY) {
          return;
        }

        this._lastX = Sortable.touchEvt.clientX;
        this._lastY = Sortable.touchEvt.clientY;

        if (!supportCssPointerEvents) {
          _css(Sortable.ghostEl, 'display', 'none')
        }

        var target = doc.elementFromPoint(Sortable.touchEvt.clientX, Sortable.touchEvt.clientY)
        var parent = target;
        var i = touchDragOverListeners.length;

        while (target && target.shadowRoot) {
          target = target.shadowRoot.elementFromPoint(Sortable.touchEvt.clientX, Sortable.touchEvt.clientY)
          parent = target;
        }

        if (parent) {
          do {
            if (parent.sortableInstance) {
              while (i--) {
                touchDragOverListeners[i]({
                  clientX: Sortable.touchEvt.clientX,
                  clientY: Sortable.touchEvt.clientY,
                  target: target,
                  rootEl: parent
                })
              }

              break;
            }

            target = parent; // store last element
          }
          /* jshint boss:true */
          while (parent = parent.parentNode)
        }

        if (!supportCssPointerEvents) {
          _css(Sortable.ghostEl, 'display', '')
        }
      }
    }
    this._onTouchMove = function (e) {
      if (Sortable.tapEvt) {
        var  options = this.options,
          fallbackTolerance = options.fallbackTolerance,
          fallbackOffset = options.fallbackOffset,
          touch = e.touches ? e.touches[0] : e,
          dx = (touch.clientX - Sortable.tapEvt.clientX) + fallbackOffset.x,
          dy = (touch.clientY - Sortable.tapEvt.clientY) + fallbackOffset.y,
          translate3d = e.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

        // only set the status to dragging, when we are actually dragging
        if (!Sortable.activeSortableItem) {
          if (fallbackTolerance &&
            min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance
          ) {
            return;
          }

          this._dragStarted(e)
        }

        // as well as creating the ghost element on the document body
        this._appendGhost()

        Sortable.moved = true;
        Sortable.touchEvt = touch;

        _css(Sortable.ghostEl, 'webkitTransform', translate3d)
        _css(Sortable.ghostEl, 'mozTransform', translate3d)
        _css(Sortable.ghostEl, 'msTransform', translate3d)
        _css(Sortable.ghostEl, 'transform', translate3d)

        e.preventDefault()
      }
    }

    this._triggerDragStart = function (evt, touch, rootEl, dragEl) {
      touch = touch || (evt.pointerType == 'touch' ? evt : null)

      if (touch) {
        // Touch device support
        Sortable.tapEvt = {
          target: dragEl,
          clientX: touch.clientX,
          clientY: touch.clientY
        };

        this._onDragStart(Sortable.tapEvt, 'touch')
      }
      else if (!this.nativeDraggable) {
        this._onDragStart(Sortable.tapEvt, true)
      }
      else {
        _on(dragEl, 'dragend', this)
        _on(rootEl, 'dragstart', this._onDragStart)
      }

      try {
        if (doc.selection) {
          // Timeout neccessary for IE9
          _nextTick(function () {
            doc.selection.empty()
          })
        } else {
          win.getSelection().removeAllRanges()
        }
      } catch (err) {
      }
    }
    this._onDragStart =  function (e, useFallback) {
      var el = getFirstSortableParent(e.target)

      var _this = this
      var dataTransfer = e.dataTransfer
      var options = _this.options

      _this._offUpEvents()

      if (Sortable.activeGroup.checkPull(_this, _this, Sortable.draggableItem, e)) {
        Sortable.cloneEl = clone(Sortable.draggableItem)

        Sortable.cloneEl.draggable = false
        Sortable.cloneEl.style['will-change'] = ''

        _css(Sortable.cloneEl, 'display', 'none')
        _toggleClass(Sortable.cloneEl, _this.options.chosenClass, false)

        // #1143: IFrame support workaround
        _this._cloneId = _nextTick(function () {
          Sortable.rootEl.insertBefore(Sortable.cloneEl, Sortable.draggableItem)
          _dispatchEvent(_this, Sortable.rootEl, Sortable.cloneEl, 'clone', Sortable.draggableItem)
        })
      }

      _toggleClass(Sortable.draggableItem, options.dragClass, true)

      if (useFallback) {
        if (useFallback === 'touch') {
          // Bind touch events
          _on(doc, 'touchmove', _this._onTouchMove)
          _on(doc, 'touchend', _this._onDrop)
          _on(doc, 'touchcancel', _this._onDrop)

          if (options.supportPointer) {
            _on(doc, 'pointermove', _this._onTouchMove)
            _on(doc, 'pointerup', _this._onDrop)
          }
        } else {
          // Old brwoser
          _on(doc, 'mousemove', _this._onTouchMove)
          _on(doc, 'mouseup', _this._onDrop)
        }

        _this._loopId = setInterval(_this._emulateDragOver, 50)
      }
      else {
        if (dataTransfer) {
          dataTransfer.effectAllowed = 'move';
          options.setData && options.setData.call(_this, dataTransfer, Sortable.draggableItem)
        }

        _on(doc, 'drop', _this)

        // #1143: Бывает элемент с IFrame внутри блокирует `drop`,
        // поэтому если вызвался `mouseover`, значит надо отменять весь d'n'd.
        // Breaking Chrome 62+
        // _on(doc, 'mouseover', _this)

        _this._dragStartId = _nextTick(function () { _this._dragStarted(e) })
      }
    }
    this._onMove = function (fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
      var el = getFirstSortableParent(originalEvt.target)

      var e,
        sortable = fromEl.sortableInstance,
        onMoveFn = sortable.options.onMove,
        retVal;

      e = doc.createEvent('Event')
      e.initEvent('move', true, true)

      e.to = toEl;
      e.from = fromEl;
      e.dragged = Sortable.draggableItem;
      e.draggedRect = dragRect;
      e.related = targetEl || toEl;
      e.relatedRect = targetRect || toEl.getBoundingClientRect()
      e.willInsertAfter = willInsertAfter;

      e.originalEvent = originalEvt;

      fromEl.dispatchEvent(e)

      if (onMoveFn) {
        retVal = onMoveFn.call(sortable, e, originalEvt)
      }

      return retVal;
    }
    this._onDragOver =  function (e) {
      var el = this.el,
        target,
        dragRect,
        targetRect,
        revert,
        options = this.options,
        group = options.group,
        activeSortable = Sortable.activeSortableItem,
        isOwner = (Sortable.activeGroup === group),
        isMovingBetweenSortable = false,
        canSort = options.sort;

      if (e.preventDefault !== void 0) {
        e.preventDefault()
        !options.dragoverBubble && e.stopPropagation()
      }

      if (Sortable.draggableItem.animated) {
        return;
      }

      Sortable.moved = true;

      if (activeSortable && !options.disabled &&
        (isOwner
          ? canSort || (revert = !Sortable.rootEl.contains(Sortable.draggableItem)) // Reverting item into the original list
          : (
            Sortable.putSortable === this ||
            (
              (activeSortable.lastPullMode = Sortable.activeGroup.checkPull(this, activeSortable, Sortable.draggableItem, e)) &&
              group.checkPut(this, activeSortable, Sortable.draggableItem, e)
            )
          )
        ) &&
        (e.rootEl === void 0 || e.rootEl === this.el) // touch fallback
      ) {
        // Smart auto-scrolling
        _autoScroll(e, options, this.el, Sortable, Sortable.autoScroll)

        if (Sortable.silent) {
          return;
        }

        target = _closest(e.target, options.draggable, el)
        dragRect = Sortable.draggableItem.getBoundingClientRect()

        if (Sortable.putSortable !== this) {
          Sortable.putSortable = this;
          isMovingBetweenSortable = true;
        }

        if (revert) {
          _cloneHide(activeSortable, Sortable.rootEl, Sortable.cloneEl, Sortable.draggableItem, true)
          Sortable.parentEl = Sortable.rootEl; // actualization

          if (Sortable.cloneEl || Sortable.nextEl) {
            Sortable.rootEl.insertBefore(Sortable.draggableItem, Sortable.cloneEl || Sortable.nextEl)
          }
          else if (!canSort) {
            Sortable.rootEl.appendChild(Sortable.draggableItem)
          }

          return;
        }

        if ((el.children.length === 0) || (el.children[0] === Sortable.ghostEl) ||
          (el === e.target) && (this._ghostIsLast(el, e))
        ) {
          //assign target only if condition is true
          if (el.children.length !== 0 && el.children[0] !== Sortable.ghostEl && el === e.target) {
            target = el.lastElementChild;
          }

          if (target) {
            if (target.animated) {
              return;
            }

            targetRect = target.getBoundingClientRect()
          }

          _cloneHide(activeSortable, Sortable.rootEl, Sortable.cloneEl, Sortable.draggableItem, isOwner)

          if (this._onMove(Sortable.rootEl, el, Sortable.draggableItem, dragRect, target, targetRect, e) !== false) {
            if (!Sortable.draggableItem.contains(el)) {
              el.appendChild(Sortable.draggableItem)
              Sortable.parentEl = el; // actualization
            }

            this._animate(dragRect, Sortable.draggableItem)
            target && this._animate(targetRect, target)
          }
        }
        else if (target && !target.animated && target !== Sortable.draggableItem && (target.parentNode.sortableInstance !== void 0)) {
          if (Sortable.lastEl !== target) {
            Sortable.lastEl = target;
            Sortable.lastCSS = _css(target)
            Sortable.lastParentCSS = _css(target.parentNode)
          }

          targetRect = target.getBoundingClientRect()

          var width = targetRect.right - targetRect.left,
            height = targetRect.bottom - targetRect.top,
            floating = R_FLOAT.test(Sortable.lastCSS.cssFloat + Sortable.lastCSS.display)
              || (Sortable.lastParentCSS.display == 'flex' && Sortable.lastParentCSS['flex-direction'].indexOf('row') === 0),
            isWide = (target.offsetWidth > Sortable.draggableItem.offsetWidth),
            isLong = (target.offsetHeight > Sortable.draggableItem.offsetHeight),
            halfway = (floating ? (e.clientX - targetRect.left) / width : (e.clientY - targetRect.top) / height) > 0.5,
            nextSibling = target.nextElementSibling,
            after = false
          ;

          if (floating) {
            var elTop = Sortable.draggableItem.offsetTop,
              tgTop = target.offsetTop;

            if (elTop === tgTop) {
              after = (target.previousElementSibling === Sortable.draggableItem) && !isWide || halfway && isWide;
            }
            else if (target.previousElementSibling === Sortable.draggableItem || Sortable.draggableItem.previousElementSibling === target) {
              after = (e.clientY - targetRect.top) / height > 0.5;
            } else {
              after = tgTop > elTop;
            }
            } else if (!isMovingBetweenSortable) {
            after = (nextSibling !== Sortable.draggableItem) && !isLong || halfway && isLong;
          }

          var moveVector = this._onMove(Sortable.rootEl, el, Sortable.draggableItem, dragRect, target, targetRect, e, after)

          if (moveVector !== false) {
            if (moveVector === 1 || moveVector === -1) {
              after = (moveVector === 1)
            }

            Sortable.silent = true;
            setTimeout(function () { Sortable.silent = false }, 30)

            _cloneHide(activeSortable, Sortable.rootEl, Sortable.cloneEl, Sortable.draggableItem, isOwner)

            if (!Sortable.draggableItem.contains(el)) {
              if (after && !nextSibling) {
                el.appendChild(Sortable.draggableItem)
              } else {
                target.parentNode.insertBefore(Sortable.draggableItem, after ? nextSibling : target)
              }
            }

            Sortable.parentEl = Sortable.draggableItem.parentNode; // actualization

            this._animate(dragRect, Sortable.draggableItem)
            this._animate(targetRect, target)
          }
        }
      }
    }
    this._onDrop = function (e) {
      var el = this.el,
        options = this.options;

      clearInterval(this._loopId)
      clearInterval(Sortable.autoScroll.pid)
      clearTimeout(this._dragStartTimer)

      _cancelNextTick(this._cloneId)
      _cancelNextTick(this._dragStartId)

      // Unbind events
      _off(doc, 'mouseover', this)
      _off(doc, 'mousemove', this._onTouchMove)

      if (this.nativeDraggable) {
        _off(doc, 'drop', this)
        _off(el, 'dragstart', this._onDragStart)
      }

      this._offUpEvents()

      if (e) {
        if (Sortable.moved) {
          e.preventDefault()
          !options.dropBubble && e.stopPropagation()
        }

        Sortable.ghostEl && Sortable.ghostEl.parentNode && Sortable.ghostEl.parentNode.removeChild(Sortable.ghostEl)

        if (Sortable.rootEl === Sortable.parentEl || Sortable.activeSortableItem.lastPullMode !== 'clone') {
          // Remove clone
          Sortable.cloneEl && Sortable.cloneEl.parentNode && Sortable.cloneEl.parentNode.removeChild(Sortable.cloneEl)
        }

        if (Sortable.draggableItem) {
          if (this.nativeDraggable) {
            _off(Sortable.draggableItem, 'dragend', this)
          }

          _disableDraggable(Sortable.draggableItem)
          Sortable.draggableItem.style['will-change'] = '';

          // Remove class's
          _toggleClass(Sortable.draggableItem, this.options.ghostClass, false)
          _toggleClass(Sortable.draggableItem, this.options.chosenClass, false)

          // Drag stop event
          _dispatchEvent(this, Sortable.rootEl, Sortable.cloneEl, 'unchoose', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, null, e)

          if (Sortable.rootEl !== Sortable.parentEl) {
            Sortable.newIndex = _index(Sortable.draggableItem, options.draggable)

            if (Sortable.newIndex >= 0) {
              // Add event
              _dispatchEvent(null, Sortable.parentEl, Sortable.cloneEl, 'add', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, Sortable.newIndex, e)

              // Remove event
              _dispatchEvent(this, Sortable.rootEl, Sortable.cloneEl, 'remove', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, Sortable.newIndex, e)

              // drag from one list and drop into another
              _dispatchEvent(null, Sortable.parentEl, Sortable.cloneEl, 'sort', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, Sortable.newIndex, e)
              _dispatchEvent(this, Sortable.rootEl, Sortable.cloneEl, 'sort', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, Sortable.newIndex, e)
            }
          }
          else {
            if (Sortable.draggableItem.nextSibling !== Sortable.nextEl) {
              // Get the index of the dragged element within its parent
              Sortable.newIndex = _index(Sortable.draggableItem, options.draggable)

              if (Sortable.newIndex >= 0) {
                // drag & drop within the same list
                _dispatchEvent(this, Sortable.rootEl, Sortable.cloneEl, 'update', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, Sortable.newIndex, e)
                _dispatchEvent(this, Sortable.rootEl, Sortable.cloneEl, 'sort', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, Sortable.newIndex, e)
              }
            }
          }

          if (Sortable.activeSortableItem) {
            /* jshint eqnull:true */
            if (Sortable.newIndex == null || Sortable.newIndex === -1) {
              Sortable.newIndex = Sortable.oldIndex;
            }

            _dispatchEvent(this, Sortable.rootEl, Sortable.cloneEl, 'end', Sortable.draggableItem, Sortable.parentEl, Sortable.rootEl, Sortable.oldIndex, Sortable.newIndex, e)

            // Save sorting
            this.save()
          }
        }

      }
      this._nulling(e)
    }
    this._nulling = function(e) {
      var el = getFirstSortableParent(e.target)

      Sortable.rootEl =
      Sortable.draggableItem =
      Sortable.parentEl =
      Sortable.ghostEl =
      Sortable.nextEl =
      Sortable.cloneEl =
      Sortable.lastDownEl =
      Sortable.scrollParentEl =

      Sortable.tapEvt =
      Sortable.touchEvt =

      Sortable.moved =
      Sortable.newIndex =

      Sortable.lastEl =

      Sortable.putSortable =
      Sortable.activeGroup =
      Sortable.activeSortableItem = null;

      Sortable.savedInputChecked.forEach(function (el) {
        el.checked = true;
      })
      Sortable.savedInputChecked.length = 0;
    }

    this._appendGhost =  function () {
      if (!Sortable.ghostEl) {
        var rect = Sortable.draggableItem.getBoundingClientRect(),
          css = _css(Sortable.draggableItem),
          options = this.options,
          ghostRect;

        Sortable.ghostEl = Sortable.draggableItem.cloneNode(true)

        _toggleClass(Sortable.ghostEl, options.ghostClass, false)
        _toggleClass(Sortable.ghostEl, options.fallbackClass, true)
        _toggleClass(Sortable.ghostEl, options.dragClass, true)

        _css(Sortable.ghostEl, 'top', rect.top - toInt(css.marginTop))
        _css(Sortable.ghostEl, 'left', rect.left - toInt(css.marginLeft))
        _css(Sortable.ghostEl, 'width', rect.width)
        _css(Sortable.ghostEl, 'height', rect.height)
        _css(Sortable.ghostEl, 'opacity', '0.8')
        _css(Sortable.ghostEl, 'position', 'fixed')
        _css(Sortable.ghostEl, 'zIndex', '100000')
        _css(Sortable.ghostEl, 'pointerEvents', 'none')

        options.fallbackOnBody && doc.body.appendChild(Sortable.ghostEl) || Sortable.rootEl.appendChild(Sortable.ghostEl)

        // Fixing dimensions.
        ghostRect = Sortable.ghostEl.getBoundingClientRect()
        _css(Sortable.ghostEl, 'width', rect.width * 2 - ghostRect.width)
        _css(Sortable.ghostEl, 'height', rect.height * 2 - ghostRect.height)
      }
    }
    this._ghostIsLast = function (el, e) {
      var lastEl = el.lastElementChild,
        rect = lastEl.getBoundingClientRect()

      // 5 — min delta
      // abs — нельзя добавлять, а то глюки при наведении сверху
      return (e.clientY - (rect.top + rect.height) > 5) ||
        (e.clientX - (rect.left + rect.width) > 5)
    }

    this._animate = function (prevRect, target) {
      var ms = this.options.animation;

      if (ms) {
        var currentRect = target.getBoundingClientRect()

        if (prevRect.nodeType === 1) {
          prevRect = prevRect.getBoundingClientRect()
        }

        _css(target, 'transition', 'none')
        _css(target, 'transform', 'translate3d('
          + (prevRect.left - currentRect.left) + 'px,'
          + (prevRect.top - currentRect.top) + 'px,0)'
        )

        var forRepaintDummy = target.offsetWidth; // repaint

        _css(target, 'transition', 'all ' + ms + 'ms')
        _css(target, 'transform', 'translate3d(0,0,0)')

        clearTimeout(target.animated)
        target.animated = setTimeout(function () {
          _css(target, 'transition', '')
          _css(target, 'transform', '')
          target.animated = false;
        }, ms)
      }
    }
    this._offUpEvents = function () {
      var ownerDocument = this.el.ownerDocument;

      _off(doc, 'touchmove', this._onTouchMove)
      _off(doc, 'pointermove', this._onTouchMove)
      _off(ownerDocument, 'mouseup', this._onDrop)
      _off(ownerDocument, 'touchend', this._onDrop)
      _off(ownerDocument, 'pointerup', this._onDrop)
      _off(ownerDocument, 'touchcancel', this._onDrop)
      _off(ownerDocument, 'pointercancel', this._onDrop)
      _off(ownerDocument, 'selectstart', this)
    }

    this.closest = function (el, selector) {
      return _closest(el, selector || this.options.draggable, this.el)
    }
    this.option = function (name, value) {
      var options = this.options;

      if (value === void 0) {
        return options[name];
      } else {
        options[name] = value;

        if (name === 'group') {
          _prepareGroup(options)
        }
      }
    }
    this.destroy = function () {
      var el = this.el;

      el.sortableInstance = null;

      _off(el, 'mousedown', this._onTapStart)
      _off(el, 'touchstart', this._onTapStart)
      _off(el, 'pointerdown', this._onTapStart)

      if (this.nativeDraggable) {
        _off(el, 'dragover', this)
        _off(el, 'dragenter', this)
      }

      // Remove draggable attributes
      Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
        el.removeAttribute('draggable')
      })

      touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1)

      this._onDrop()

      this.el = el = null;
    }

    this.toArray = function () {
      var order = [],
        el,
        children = this.el.children,
        i = 0,
        n = children.length,
        options = this.options;

      for (; i < n; i++) {
        el = children[i];
        if (_closest(el, options.draggable, this.el)) {
          order.push(el.getAttribute(options.dataIdAttr) || _generateId(el))
        }
      }

      return order;
    }
    this.sort = function (order) {
      var items = {}, rootEl = this.el;

      this.toArray().forEach(function (id, i) {
        var el = rootEl.children[i];

        if (_closest(el, this.options.draggable, rootEl)) {
          items[id] = el;
        }
      }, this)

      order.forEach(function (id) {
        if (items[id]) {
          rootEl.removeChild(items[id])
          rootEl.appendChild(items[id])
        }
      })
    }
    this.save = function () {
      var store = this.options.store;
      store && store.set(this)
    }

    this._saveInputCheckedState = function (root) {
      Sortable.savedInputChecked.length = 0;

      var inputs = root.getElementsByTagName('input')
      var idx = inputs.length;

      while (idx--) {
        var el = inputs[idx];
        el.checked && Sortable.savedInputChecked.push(el)
      }
    }
  }

  detectSupportActiveMode()

  function initialize(el, options) {
    htmlElementIsRequired(el)

    _defineImplementationMethods.bind(this)()

    // Root element
    this.el = el;
    this.options = options = _extend({}, options)

    // Export instance
    el.sortableInstance = this;

    // Default options
    var defaults = {
      group: null,
      sort: true,
      disabled: false,
      store: null,
      handle: null,
      scroll: true,
      scrollSensitivity: 30,
      scrollSpeed: 10,
      draggable: /[uo]l/i.test(el.nodeName) ? 'li' : '>*',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      ignore: 'a, img',
      filter: null,
      preventOnFilter: true,
      animation: 0,
      setData: function (dataTransfer, dragEl) {
        dataTransfer.setData('Text', dragEl.textContent)
      },
      dropBubble: false,
      dragoverBubble: false,
      dataIdAttr: 'data-id',
      delay: 0,
      touchStartThreshold: toInt(win.devicePixelRatio) || 1,
      forceFallback: false,
      fallbackClass: 'sortable-fallback',
      fallbackOnBody: false,
      fallbackTolerance: 0,
      fallbackOffset: {x: 0, y: 0},
      supportPointer: Sortable.supportPointer !== false
    };

    // Set default options
    for (var name in defaults) {
      !(name in options) && (options[name] = defaults[name])
    }

    _prepareGroup(options)

    // Bind all private methods
    for (var fn in this) {
      if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
        this[fn] = this[fn].bind(this)
      }
    }

    // Setup drag mode
    const supportDraggable = 'draggable' in newTag('div')
    this.nativeDraggable = options.forceFallback ? false : supportDraggable;

    // Bind events
    _on(el, 'mousedown', this._onTapStart)
    _on(el, 'touchstart', this._onTapStart)

    options.supportPointer && _on(el, 'pointerdown', this._onTapStart)

    if (this.nativeDraggable) {
      _on(el, 'dragover', this)
      _on(el, 'dragenter', this)
    }

    touchDragOverListeners.push(this._onDragOver)

    // Restore sorting
    options.store && this.sort(options.store.get(this))
  }

  // Fixed https://github.com/RubaXa/Sortable/issues/973
  _on(doc, 'touchmove', function (e) {
    if (Sortable.activeSortableItem) {
      e.preventDefault()
    }
  })

  return initialize;
})()

Sortable.version = '1.7.1'

Sortable.silent = false
Sortable.autoScroll = {}
Sortable.savedInputChecked = []

export default Sortable
