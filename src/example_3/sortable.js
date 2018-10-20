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
  _disableDraggable,
  getFirstSortableParent
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

import SortableCurrentState from './sortableCurrentState'

const Sortable = (function () {
  'use strict';

  raiseExceptionIfNotBrowserEnvironment()

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

          if (SortableCurrentState.draggableItem) {
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

      if (target && !SortableCurrentState.draggableItem && (target.parentNode === el)) {
        SortableCurrentState.tapEvt = e;
        SortableCurrentState.rootEl = el;
        SortableCurrentState.draggableItem = target;
        SortableCurrentState.parentEl = SortableCurrentState.draggableItem.parentNode;
        SortableCurrentState.nextEl = SortableCurrentState.draggableItem.nextSibling;
        SortableCurrentState.lastDownEl = target;
        SortableCurrentState.activeGroup = options.group;
        SortableCurrentState.oldIndex = startIndex;

        this._lastX = (touch || e).clientX;
        this._lastY = (touch || e).clientY;

        SortableCurrentState.draggableItem.style['will-change'] = 'all';

        dragStartFn = function () {
          // Delayed drag has been triggered
          // we can re-enable the events: touchmove/mousemove
          _this._disableDelayedDrag()

          // Make the element draggable
          SortableCurrentState.draggableItem.draggable = _this.nativeDraggable;

          // Chosen item
          _toggleClass(SortableCurrentState.draggableItem, options.chosenClass, true)

          // Bind the events: dragstart/dragend
          _this._triggerDragStart(e, touch, SortableCurrentState.rootEl, SortableCurrentState.draggableItem)

          // Drag start event
          _dispatchEvent(_this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'choose', SortableCurrentState.draggableItem, SortableCurrentState.rootEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex)
        };

        // Disable "draggable"
        options.ignore.split(',').forEach(function (criteria) {
          _find(SortableCurrentState.draggableItem, criteria.trim(), _disableDraggable)
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
      if (SortableCurrentState.draggableItem) {
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

      if (SortableCurrentState.lastDownEl === target) {
        // Ignoring duplicate `down`
        return;
      }

      // Get the index of the dragged element within its parent
      startIndex = _index(target, options.draggable)

      // Check filter
      if (typeof filter === 'function') {
        if (filter.call(this, e, target, this)) {
          _dispatchEvent(_this, originalTarget, SortableCurrentState.cloneEl, 'filter', target, el, el, startIndex)
          preventOnFilter && e.preventDefault()
          return; // cancel dnd
        }
      }
      else if (filter) {
        filter = filter.split(',').some(function (criteria) {
          criteria = _closest(originalTarget, criteria.trim(), el)

          if (criteria) {
            _dispatchEvent(_this, criteria, SortableCurrentState.cloneEl, 'filter', target, el, el, startIndex)
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

      if (SortableCurrentState.rootEl && SortableCurrentState.draggableItem) {
        var options = this.options;

        // Apply effect
        _toggleClass(SortableCurrentState.draggableItem, options.ghostClass, true)
        _toggleClass(SortableCurrentState.draggableItem, options.dragClass, false)

        SortableCurrentState.activeSortableItem = this;

        // Drag start event
        _dispatchEvent(this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'start', SortableCurrentState.draggableItem, SortableCurrentState.rootEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex)
      } else {
        this._nulling(e)
      }
    }
    this._emulateDragOver = function () {
      if (SortableCurrentState.touchEvt) {
        if (this._lastX === SortableCurrentState.touchEvt.clientX && this._lastY === SortableCurrentState.touchEvt.clientY) {
          return;
        }

        this._lastX = SortableCurrentState.touchEvt.clientX;
        this._lastY = SortableCurrentState.touchEvt.clientY;

        if (!supportCssPointerEvents) {
          _css(SortableCurrentState.ghostEl, 'display', 'none')
        }

        var target = doc.elementFromPoint(SortableCurrentState.touchEvt.clientX, SortableCurrentState.touchEvt.clientY)
        var parent = target;
        var i = SortableCurrentState.touchDragOverListeners.length;

        while (target && target.shadowRoot) {
          target = target.shadowRoot.elementFromPoint(SortableCurrentState.touchEvt.clientX, SortableCurrentState.touchEvt.clientY)
          parent = target;
        }

        if (parent) {
          do {
            if (parent.sortableInstance) {
              while (i--) {
                SortableCurrentState.touchDragOverListeners[i]({
                  clientX: SortableCurrentState.touchEvt.clientX,
                  clientY: SortableCurrentState.touchEvt.clientY,
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
          _css(SortableCurrentState.ghostEl, 'display', '')
        }
      }
    }
    this._onTouchMove = function (e) {
      if (SortableCurrentState.tapEvt) {
        var  options = this.options,
          fallbackTolerance = options.fallbackTolerance,
          fallbackOffset = options.fallbackOffset,
          touch = e.touches ? e.touches[0] : e,
          dx = (touch.clientX - SortableCurrentState.tapEvt.clientX) + fallbackOffset.x,
          dy = (touch.clientY - SortableCurrentState.tapEvt.clientY) + fallbackOffset.y,
          translate3d = e.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

        // only set the status to dragging, when we are actually dragging
        if (!SortableCurrentState.activeSortableItem) {
          if (fallbackTolerance &&
            min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance
          ) {
            return;
          }

          this._dragStarted(e)
        }

        // as well as creating the ghost element on the document body
        this._appendGhost()

        SortableCurrentState.moved = true;
        SortableCurrentState.touchEvt = touch;

        _css(SortableCurrentState.ghostEl, 'webkitTransform', translate3d)
        _css(SortableCurrentState.ghostEl, 'mozTransform', translate3d)
        _css(SortableCurrentState.ghostEl, 'msTransform', translate3d)
        _css(SortableCurrentState.ghostEl, 'transform', translate3d)

        e.preventDefault()
      }
    }

    this._triggerDragStart = function (e, touch, rootEl, dragEl) {
      touch = touch || (e.pointerType == 'touch' ? e : null)

      if (touch) {
        // Touch device support
        SortableCurrentState.tapEvt = {
          target: dragEl,
          clientX: touch.clientX,
          clientY: touch.clientY
        };

        this._onDragStart(SortableCurrentState.tapEvt, 'touch')
      }
      else if (!this.nativeDraggable) {
        this._onDragStart(SortableCurrentState.tapEvt, true)
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

      if (SortableCurrentState.activeGroup.checkPull(_this, _this, SortableCurrentState.draggableItem, e)) {
        SortableCurrentState.cloneEl = clone(SortableCurrentState.draggableItem)

        SortableCurrentState.cloneEl.draggable = false
        SortableCurrentState.cloneEl.style['will-change'] = ''

        _css(SortableCurrentState.cloneEl, 'display', 'none')
        _toggleClass(SortableCurrentState.cloneEl, _this.options.chosenClass, false)

        // #1143: IFrame support workaround
        _this._cloneId = _nextTick(function () {
          SortableCurrentState.rootEl.insertBefore(SortableCurrentState.cloneEl, SortableCurrentState.draggableItem)
          _dispatchEvent(_this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'clone', SortableCurrentState.draggableItem)
        })
      }

      _toggleClass(SortableCurrentState.draggableItem, options.dragClass, true)

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
          options.setData && options.setData.call(_this, dataTransfer, SortableCurrentState.draggableItem)
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
      e.dragged = SortableCurrentState.draggableItem;
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
        activeSortable = SortableCurrentState.activeSortableItem,
        isOwner = (SortableCurrentState.activeGroup === group),
        isMovingBetweenSortable = false,
        canSort = options.sort;

      if (e.preventDefault !== void 0) {
        e.preventDefault()
        !options.dragoverBubble && e.stopPropagation()
      }

      if (SortableCurrentState.draggableItem.animated) {
        return;
      }

      SortableCurrentState.moved = true;

      if (activeSortable && !options.disabled &&
        (isOwner
          ? canSort || (revert = !SortableCurrentState.rootEl.contains(SortableCurrentState.draggableItem)) // Reverting item into the original list
          : (
            SortableCurrentState.putSortable === this ||
            (
              (activeSortable.lastPullMode = SortableCurrentState.activeGroup.checkPull(this, activeSortable, SortableCurrentState.draggableItem, e)) &&
              group.checkPut(this, activeSortable, SortableCurrentState.draggableItem, e)
            )
          )
        ) &&
        (e.rootEl === void 0 || e.rootEl === this.el) // touch fallback
      ) {
        // Smart auto-scrolling
        _autoScroll(e, options, this.el, SortableCurrentState, SortableCurrentState.autoScroll)

        if (SortableCurrentState.silent) {
          return;
        }

        target = _closest(e.target, options.draggable, el)
        dragRect = SortableCurrentState.draggableItem.getBoundingClientRect()

        if (SortableCurrentState.putSortable !== this) {
          SortableCurrentState.putSortable = this;
          isMovingBetweenSortable = true;
        }

        if (revert) {
          _cloneHide(activeSortable, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, SortableCurrentState.draggableItem, true)
          SortableCurrentState.parentEl = SortableCurrentState.rootEl; // actualization

          if (SortableCurrentState.cloneEl || SortableCurrentState.nextEl) {
            SortableCurrentState.rootEl.insertBefore(SortableCurrentState.draggableItem, SortableCurrentState.cloneEl || SortableCurrentState.nextEl)
          }
          else if (!canSort) {
            SortableCurrentState.rootEl.appendChild(SortableCurrentState.draggableItem)
          }

          return;
        }

        if ((el.children.length === 0) || (el.children[0] === SortableCurrentState.ghostEl) ||
          (el === e.target) && (this._ghostIsLast(el, e))
        ) {
          //assign target only if condition is true
          if (el.children.length !== 0 && el.children[0] !== SortableCurrentState.ghostEl && el === e.target) {
            target = el.lastElementChild;
          }

          if (target) {
            if (target.animated) {
              return;
            }

            targetRect = target.getBoundingClientRect()
          }

          _cloneHide(activeSortable, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, SortableCurrentState.draggableItem, isOwner)

          if (this._onMove(SortableCurrentState.rootEl, el, SortableCurrentState.draggableItem, dragRect, target, targetRect, e) !== false) {
            if (!SortableCurrentState.draggableItem.contains(el)) {
              el.appendChild(SortableCurrentState.draggableItem)
              SortableCurrentState.parentEl = el; // actualization
            }

            this._animate(dragRect, SortableCurrentState.draggableItem)
            target && this._animate(targetRect, target)
          }
        }
        else if (target && !target.animated && target !== SortableCurrentState.draggableItem && (target.parentNode.sortableInstance !== void 0)) {
          if (SortableCurrentState.lastEl !== target) {
            SortableCurrentState.lastEl = target;
            Sortable.lastCSS = _css(target)
            Sortable.lastParentCSS = _css(target.parentNode)
          }

          targetRect = target.getBoundingClientRect()

          var width = targetRect.right - targetRect.left,
            height = targetRect.bottom - targetRect.top,
            floating = R_FLOAT.test(Sortable.lastCSS.cssFloat + Sortable.lastCSS.display)
              || (Sortable.lastParentCSS.display == 'flex' && Sortable.lastParentCSS['flex-direction'].indexOf('row') === 0),
            isWide = (target.offsetWidth > SortableCurrentState.draggableItem.offsetWidth),
            isLong = (target.offsetHeight > SortableCurrentState.draggableItem.offsetHeight),
            halfway = (floating ? (e.clientX - targetRect.left) / width : (e.clientY - targetRect.top) / height) > 0.5,
            nextSibling = target.nextElementSibling,
            after = false
          ;

          if (floating) {
            var elTop = SortableCurrentState.draggableItem.offsetTop,
              tgTop = target.offsetTop;

            if (elTop === tgTop) {
              after = (target.previousElementSibling === SortableCurrentState.draggableItem) && !isWide || halfway && isWide;
            }
            else if (target.previousElementSibling === SortableCurrentState.draggableItem || SortableCurrentState.draggableItem.previousElementSibling === target) {
              after = (e.clientY - targetRect.top) / height > 0.5;
            } else {
              after = tgTop > elTop;
            }
            } else if (!isMovingBetweenSortable) {
            after = (nextSibling !== SortableCurrentState.draggableItem) && !isLong || halfway && isLong;
          }

          var moveVector = this._onMove(SortableCurrentState.rootEl, el, SortableCurrentState.draggableItem, dragRect, target, targetRect, e, after)

          if (moveVector !== false) {
            if (moveVector === 1 || moveVector === -1) {
              after = (moveVector === 1)
            }

            SortableCurrentState.silent = true;
            setTimeout(function () { SortableCurrentState.silent = false }, 30)

            _cloneHide(activeSortable, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, SortableCurrentState.draggableItem, isOwner)

            if (!SortableCurrentState.draggableItem.contains(el)) {
              if (after && !nextSibling) {
                el.appendChild(SortableCurrentState.draggableItem)
              } else {
                target.parentNode.insertBefore(SortableCurrentState.draggableItem, after ? nextSibling : target)
              }
            }

            SortableCurrentState.parentEl = SortableCurrentState.draggableItem.parentNode; // actualization

            this._animate(dragRect, SortableCurrentState.draggableItem)
            this._animate(targetRect, target)
          }
        }
      }
    }
    this._onDrop = function (e) {
      var el = this.el,
        options = this.options;

      clearInterval(this._loopId)
      clearInterval(SortableCurrentState.autoScroll.pid)
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
        if (SortableCurrentState.moved) {
          e.preventDefault()
          !options.dropBubble && e.stopPropagation()
        }

        SortableCurrentState.ghostEl && SortableCurrentState.ghostEl.parentNode && SortableCurrentState.ghostEl.parentNode.removeChild(SortableCurrentState.ghostEl)

        if (SortableCurrentState.rootEl === SortableCurrentState.parentEl || SortableCurrentState.activeSortableItem.lastPullMode !== 'clone') {
          // Remove clone
          SortableCurrentState.cloneEl && SortableCurrentState.cloneEl.parentNode && SortableCurrentState.cloneEl.parentNode.removeChild(SortableCurrentState.cloneEl)
        }

        if (SortableCurrentState.draggableItem) {
          if (this.nativeDraggable) {
            _off(SortableCurrentState.draggableItem, 'dragend', this)
          }

          _disableDraggable(SortableCurrentState.draggableItem)
          SortableCurrentState.draggableItem.style['will-change'] = '';

          // Remove class's
          _toggleClass(SortableCurrentState.draggableItem, this.options.ghostClass, false)
          _toggleClass(SortableCurrentState.draggableItem, this.options.chosenClass, false)

          // Drag stop event
          _dispatchEvent(this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'unchoose', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, null, e)

          if (SortableCurrentState.rootEl !== SortableCurrentState.parentEl) {
            SortableCurrentState.newIndex = _index(SortableCurrentState.draggableItem, options.draggable)

            if (SortableCurrentState.newIndex >= 0) {
              // Add event
              _dispatchEvent(null, SortableCurrentState.parentEl, SortableCurrentState.cloneEl, 'add', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, SortableCurrentState.newIndex, e)

              // Remove event
              _dispatchEvent(this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'remove', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, SortableCurrentState.newIndex, e)

              // drag from one list and drop into another
              _dispatchEvent(null, SortableCurrentState.parentEl, SortableCurrentState.cloneEl, 'sort', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, SortableCurrentState.newIndex, e)
              _dispatchEvent(this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'sort', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, SortableCurrentState.newIndex, e)
            }
          }
          else {
            if (SortableCurrentState.draggableItem.nextSibling !== SortableCurrentState.nextEl) {
              // Get the index of the dragged element within its parent
              SortableCurrentState.newIndex = _index(SortableCurrentState.draggableItem, options.draggable)

              if (SortableCurrentState.newIndex >= 0) {
                // drag & drop within the same list
                _dispatchEvent(this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'update', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, SortableCurrentState.newIndex, e)
                _dispatchEvent(this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'sort', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, SortableCurrentState.newIndex, e)
              }
            }
          }

          if (SortableCurrentState.activeSortableItem) {
            /* jshint eqnull:true */
            if (SortableCurrentState.newIndex == null || SortableCurrentState.newIndex === -1) {
              SortableCurrentState.newIndex = SortableCurrentState.oldIndex;
            }

            _dispatchEvent(this, SortableCurrentState.rootEl, SortableCurrentState.cloneEl, 'end', SortableCurrentState.draggableItem, SortableCurrentState.parentEl, SortableCurrentState.rootEl, SortableCurrentState.oldIndex, SortableCurrentState.newIndex, e)

            // Save sorting
            this.save()
          }
        }

      }
      this._nulling(e)
    }
    this._nulling = function(e) {
      SortableCurrentState.rootEl =
      SortableCurrentState.draggableItem =
      SortableCurrentState.parentEl =
      SortableCurrentState.ghostEl =
      SortableCurrentState.nextEl =
      SortableCurrentState.cloneEl =
      SortableCurrentState.lastDownEl =
      SortableCurrentState.scrollParentEl =
      SortableCurrentState.moved =
      SortableCurrentState.newIndex =
      SortableCurrentState.oldIndex =
      SortableCurrentState.activeGroup =
      SortableCurrentState.lastEl =
      SortableCurrentState.putSortable =
      SortableCurrentState.activeSortableItem = null,

      SortableCurrentState.tapEvt =
      SortableCurrentState.touchEvt = null;

      SortableCurrentState.savedInputChecked.forEach(function (el) {
        el.checked = true;
      })
      SortableCurrentState.savedInputChecked.length = 0;
    }

    this._appendGhost =  function () {
      if (!SortableCurrentState.ghostEl) {
        var rect = SortableCurrentState.draggableItem.getBoundingClientRect(),
          css = _css(SortableCurrentState.draggableItem),
          options = this.options,
          ghostRect;

        SortableCurrentState.ghostEl = SortableCurrentState.draggableItem.cloneNode(true)

        _toggleClass(SortableCurrentState.ghostEl, options.ghostClass, false)
        _toggleClass(SortableCurrentState.ghostEl, options.fallbackClass, true)
        _toggleClass(SortableCurrentState.ghostEl, options.dragClass, true)

        _css(SortableCurrentState.ghostEl, 'top', rect.top - toInt(css.marginTop))
        _css(SortableCurrentState.ghostEl, 'left', rect.left - toInt(css.marginLeft))
        _css(SortableCurrentState.ghostEl, 'width', rect.width)
        _css(SortableCurrentState.ghostEl, 'height', rect.height)
        _css(SortableCurrentState.ghostEl, 'opacity', '0.8')
        _css(SortableCurrentState.ghostEl, 'position', 'fixed')
        _css(SortableCurrentState.ghostEl, 'zIndex', '100000')
        _css(SortableCurrentState.ghostEl, 'pointerEvents', 'none')

        options.fallbackOnBody && doc.body.appendChild(SortableCurrentState.ghostEl) || SortableCurrentState.rootEl.appendChild(SortableCurrentState.ghostEl)

        // Fixing dimensions.
        ghostRect = SortableCurrentState.ghostEl.getBoundingClientRect()
        _css(SortableCurrentState.ghostEl, 'width', rect.width * 2 - ghostRect.width)
        _css(SortableCurrentState.ghostEl, 'height', rect.height * 2 - ghostRect.height)
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

      SortableCurrentState.touchDragOverListeners.splice(SortableCurrentState.touchDragOverListeners.indexOf(this._onDragOver), 1)

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
      SortableCurrentState.savedInputChecked.length = 0;

      var inputs = root.getElementsByTagName('input')
      var idx = inputs.length;

      while (idx--) {
        var el = inputs[idx];
        el.checked && SortableCurrentState.savedInputChecked.push(el)
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

    SortableCurrentState.touchDragOverListeners.push(this._onDragOver)

    // Restore sorting
    options.store && this.sort(options.store.get(this))
  }

  // Fixed https://github.com/RubaXa/Sortable/issues/973
  _on(doc, 'touchmove', function (e) {
    if (SortableCurrentState.activeSortableItem) {
      e.preventDefault()
    }
  })

  return initialize;
})()

Sortable.version = '1.7.2'

SortableCurrentState.silent = false
SortableCurrentState.autoScroll = {}
SortableCurrentState.savedInputChecked = []
SortableCurrentState.touchDragOverListeners = []

export default Sortable
