// * Sortable
// * @author  RubaXa   <trash@rubaxa.org>
// * @license MIT

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

import {
  _triggerDragStart
} from './helpers/handlers'

const Sortable = (function () {
  'use strict';

  raiseExceptionIfNotBrowserEnvironment()

  var dragEl,
    parentEl,
    ghostEl,
    cloneEl,
    rootEl,
    nextEl,
    lastDownEl,

    scrollEl,
    scrollParentEl,
    scrollCustomFn,

    lastEl,
    lastCSS,
    lastParentCSS,

    oldIndex,
    newIndex,

    activeGroup,
    putSortable,
    activeSortableItem,

    autoScroll = {},

    tapEvt,
    touchEvt,

    moved,

    forRepaintDummy,

    _silent = false,
    savedInputChecked = [],
    touchDragOverListeners = []
  ;

  detectSupportActiveMode()

  function initialize(el, options) {
    htmlElementIsRequired(el)

    // Implementation functions
    this._prepareDragStart = function (e, touch, target, startIndex) {
      var _this = this,
        el = _this.el,
        options = _this.options,
        ownerDocument = el.ownerDocument,
        dragStartFn;

      if (target && !dragEl && (target.parentNode === el)) {
        tapEvt = e;

        rootEl = el;
        dragEl = target;
        parentEl = dragEl.parentNode;
        nextEl = dragEl.nextSibling;
        lastDownEl = target;
        activeGroup = options.group;
        oldIndex = startIndex;

        this._lastX = (touch || e).clientX;
        this._lastY = (touch || e).clientY;

        dragEl.style['will-change'] = 'all';

        dragStartFn = function () {
          // Delayed drag has been triggered
          // we can re-enable the events: touchmove/mousemove
          _this._disableDelayedDrag();

          // Make the element draggable
          dragEl.draggable = _this.nativeDraggable;

          // Chosen item
          _toggleClass(dragEl, options.chosenClass, true);

          // Bind the events: dragstart/dragend
          _triggerDragStart.bind(_this)(e, touch, rootEl, dragEl);

          // Drag start event
          _dispatchEvent(_this, rootEl, cloneEl, 'choose', dragEl, rootEl, rootEl, oldIndex);
        };

        // Disable "draggable"
        options.ignore.split(',').forEach(function (criteria) {
          _find(dragEl, criteria.trim(), _disableDraggable);
        });

        _on(ownerDocument, 'mouseup', _this._onDrop);
        _on(ownerDocument, 'touchend', _this._onDrop);
        _on(ownerDocument, 'touchcancel', _this._onDrop);
        _on(ownerDocument, 'selectstart', _this);
        options.supportPointer && _on(ownerDocument, 'pointercancel', _this._onDrop);

        if (options.delay) {
          // If the user moves the pointer or let go the click or touch
          // before the delay has been reached:
          // disable the delayed drag
          _on(ownerDocument, 'mouseup', _this._disableDelayedDrag);
          _on(ownerDocument, 'touchend', _this._disableDelayedDrag);
          _on(ownerDocument, 'touchcancel', _this._disableDelayedDrag);
          _on(ownerDocument, 'mousemove', _this._disableDelayedDrag);
          _on(ownerDocument, 'touchmove', _this._delayedDragTouchMoveHandler);
          options.supportPointer && _on(ownerDocument, 'pointermove', _this._delayedDragTouchMoveHandler);

          _this._dragStartTimer = setTimeout(dragStartFn, options.delay);
        } else {
          dragStartFn();
        }
      }
    }
    this._onTapStart = function (e) {
      var _this = this,
        el = this.el,
        options = this.options,
        preventOnFilter = options.preventOnFilter,
        type = e.type,
        touch = e.touches && e.touches[0],
        target = (touch || e).target,
        originalTarget = e.target.shadowRoot && (e.path && e.path[0]) || target,
        filter = options.filter,
        startIndex;

      this._saveInputCheckedState(el);

      // Don't trigger start event when an element is been dragged, otherwise the e.oldindex always wrong when set option.group.
      if (dragEl) {
        return;
      }

      if (/mousedown|pointerdown/.test(type) && e.button !== 0 || options.disabled) {
        return; // only left button or enabled
      }

      // cancel dnd if original target is content editable
      if (originalTarget.isContentEditable) {
        return;
      }

      target = _closest(target, options.draggable, el);

      if (!target) {
        return;
      }

      if (lastDownEl === target) {
        // Ignoring duplicate `down`
        return;
      }

      // Get the index of the dragged element within its parent
      startIndex = _index(target, options.draggable);

      // Check filter
      if (typeof filter === 'function') {
        if (filter.call(this, e, target, this)) {
          _dispatchEvent(_this, originalTarget, cloneEl, 'filter', target, el, el, startIndex);
          preventOnFilter && e.preventDefault();
          return; // cancel dnd
        }
      }
      else if (filter) {
        filter = filter.split(',').some(function (criteria) {
          criteria = _closest(originalTarget, criteria.trim(), el);

          if (criteria) {
            _dispatchEvent(_this, criteria, cloneEl, 'filter', target, el, el, startIndex);
            return true;
          }
        });

        if (filter) {
          preventOnFilter && e.preventDefault();
          return; // cancel dnd
        }
      }

      if (options.handle && !_closest(originalTarget, options.handle, el)) {
        return;
      }

      // Prepare `dragstart`
      this._prepareDragStart(e, touch, target, startIndex);
    }
    this._delayedDragTouchMoveHandler = function (e) {
      if (min(abs(e.clientX - this._lastX), abs(e.clientY - this._lastY)) >= this.options.touchStartThreshold) {
        this._disableDelayedDrag();
      }
    }
    this._disableDelayedDrag = function () {
      var ownerDocument = this.el.ownerDocument;

      clearTimeout(this._dragStartTimer);
      _off(ownerDocument, 'mouseup', this._disableDelayedDrag);
      _off(ownerDocument, 'touchend', this._disableDelayedDrag);
      _off(ownerDocument, 'touchcancel', this._disableDelayedDrag);
      _off(ownerDocument, 'mousemove', this._disableDelayedDrag);
      _off(ownerDocument, 'touchmove', this._disableDelayedDrag);
      _off(ownerDocument, 'pointermove', this._disableDelayedDrag);
    }
    this._dragStarted = function () {
      if (rootEl && dragEl) {
        var options = this.options;

        // Apply effect
        _toggleClass(dragEl, options.ghostClass, true);
        _toggleClass(dragEl, options.dragClass, false);

        activeSortableItem = this;

        // Drag start event
        _dispatchEvent(this, rootEl, cloneEl, 'start', dragEl, rootEl, rootEl, oldIndex);
      } else {
        this._nulling();
      }
    }
    this._emulateDragOver = function () {
      if (touchEvt) {
        if (this._lastX === touchEvt.clientX && this._lastY === touchEvt.clientY) {
          return;
        }

        this._lastX = touchEvt.clientX;
        this._lastY = touchEvt.clientY;

        if (!supportCssPointerEvents) {
          _css(ghostEl, 'display', 'none');
        }

        var target = doc.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
        var parent = target;
        var i = touchDragOverListeners.length;

        while (target && target.shadowRoot) {
          target = target.shadowRoot.elementFromPoint(touchEvt.clientX, touchEvt.clientY);
          parent = target;
        }

        if (parent) {
          do {
            if (parent.sortableInstance) {
              while (i--) {
                touchDragOverListeners[i]({
                  clientX: touchEvt.clientX,
                  clientY: touchEvt.clientY,
                  target: target,
                  rootEl: parent
                });
              }

              break;
            }

            target = parent; // store last element
          }
          /* jshint boss:true */
          while (parent = parent.parentNode);
        }

        if (!supportCssPointerEvents) {
          _css(ghostEl, 'display', '');
        }
      }
    }
    this._onTouchMove = function (e) {
      if (tapEvt) {
        var  options = this.options,
          fallbackTolerance = options.fallbackTolerance,
          fallbackOffset = options.fallbackOffset,
          touch = e.touches ? e.touches[0] : e,
          dx = (touch.clientX - tapEvt.clientX) + fallbackOffset.x,
          dy = (touch.clientY - tapEvt.clientY) + fallbackOffset.y,
          translate3d = e.touches ? 'translate3d(' + dx + 'px,' + dy + 'px,0)' : 'translate(' + dx + 'px,' + dy + 'px)';

        // only set the status to dragging, when we are actually dragging
        if (!activeSortableItem) {
          if (fallbackTolerance &&
            min(abs(touch.clientX - this._lastX), abs(touch.clientY - this._lastY)) < fallbackTolerance
          ) {
            return;
          }

          this._dragStarted();
        }

        // as well as creating the ghost element on the document body
        this._appendGhost();

        moved = true;
        touchEvt = touch;

        _css(ghostEl, 'webkitTransform', translate3d);
        _css(ghostEl, 'mozTransform', translate3d);
        _css(ghostEl, 'msTransform', translate3d);
        _css(ghostEl, 'transform', translate3d);

        e.preventDefault();
      }
    }
    this._appendGhost =  function () {
      if (!ghostEl) {
        var rect = dragEl.getBoundingClientRect(),
          css = _css(dragEl),
          options = this.options,
          ghostRect;

        ghostEl = dragEl.cloneNode(true);

        _toggleClass(ghostEl, options.ghostClass, false);
        _toggleClass(ghostEl, options.fallbackClass, true);
        _toggleClass(ghostEl, options.dragClass, true);

        _css(ghostEl, 'top', rect.top - toInt(css.marginTop));
        _css(ghostEl, 'left', rect.left - toInt(css.marginLeft));
        _css(ghostEl, 'width', rect.width);
        _css(ghostEl, 'height', rect.height);
        _css(ghostEl, 'opacity', '0.8');
        _css(ghostEl, 'position', 'fixed');
        _css(ghostEl, 'zIndex', '100000');
        _css(ghostEl, 'pointerEvents', 'none');

        options.fallbackOnBody && doc.body.appendChild(ghostEl) || rootEl.appendChild(ghostEl);

        // Fixing dimensions.
        ghostRect = ghostEl.getBoundingClientRect();
        _css(ghostEl, 'width', rect.width * 2 - ghostRect.width);
        _css(ghostEl, 'height', rect.height * 2 - ghostRect.height);
      }
    }
    this._onDragStart =  function (e, useFallback) {
      var _this = this
      var dataTransfer = e.dataTransfer
      var options = _this.options

      _this._offUpEvents()

      if (activeGroup.checkPull(_this, _this, dragEl, e)) {
        cloneEl = clone(dragEl)

        cloneEl.draggable = false
        cloneEl.style['will-change'] = ''

        _css(cloneEl, 'display', 'none')
        _toggleClass(cloneEl, _this.options.chosenClass, false)

        // #1143: IFrame support workaround
        _this._cloneId = _nextTick(function () {
          rootEl.insertBefore(cloneEl, dragEl);
          _dispatchEvent(_this, rootEl, cloneEl, 'clone', dragEl)
        })
      }

      _toggleClass(dragEl, options.dragClass, true);

      if (useFallback) {
        if (useFallback === 'touch') {
          // Bind touch events
          _on(doc, 'touchmove', _this._onTouchMove);
          _on(doc, 'touchend', _this._onDrop);
          _on(doc, 'touchcancel', _this._onDrop);

          if (options.supportPointer) {
            _on(doc, 'pointermove', _this._onTouchMove);
            _on(doc, 'pointerup', _this._onDrop);
          }
        } else {
          // Old brwoser
          _on(doc, 'mousemove', _this._onTouchMove);
          _on(doc, 'mouseup', _this._onDrop);
        }

        _this._loopId = setInterval(_this._emulateDragOver, 50);
      }
      else {
        if (dataTransfer) {
          dataTransfer.effectAllowed = 'move';
          options.setData && options.setData.call(_this, dataTransfer, dragEl);
        }

        _on(doc, 'drop', _this);

        // #1143: Бывает элемент с IFrame внутри блокирует `drop`,
        // поэтому если вызвался `mouseover`, значит надо отменять весь d'n'd.
        // Breaking Chrome 62+
        // _on(doc, 'mouseover', _this);

        _this._dragStartId = _nextTick(_this._dragStarted);
      }
    }
    this._onDragOver =  function (e) {
      var el = this.el,
        target,
        dragRect,
        targetRect,
        revert,
        options = this.options,
        group = options.group,
        activeSortable = activeSortableItem,
        isOwner = (activeGroup === group),
        isMovingBetweenSortable = false,
        canSort = options.sort;

      if (e.preventDefault !== void 0) {
        e.preventDefault();
        !options.dragoverBubble && e.stopPropagation();
      }

      if (dragEl.animated) {
        return;
      }

      moved = true;

      if (activeSortable && !options.disabled &&
        (isOwner
          ? canSort || (revert = !rootEl.contains(dragEl)) // Reverting item into the original list
          : (
            putSortable === this ||
            (
              (activeSortable.lastPullMode = activeGroup.checkPull(this, activeSortable, dragEl, e)) &&
              group.checkPut(this, activeSortable, dragEl, e)
            )
          )
        ) &&
        (e.rootEl === void 0 || e.rootEl === this.el) // touch fallback
      ) {
        // Smart auto-scrolling
        _autoScroll(e, options, this.el, scrollParentEl, autoScroll);

        if (_silent) {
          return;
        }

        target = _closest(e.target, options.draggable, el);
        dragRect = dragEl.getBoundingClientRect();

        if (putSortable !== this) {
          putSortable = this;
          isMovingBetweenSortable = true;
        }

        if (revert) {
          _cloneHide(activeSortable, rootEl, cloneEl, dragEl, true);
          parentEl = rootEl; // actualization

          if (cloneEl || nextEl) {
            rootEl.insertBefore(dragEl, cloneEl || nextEl);
          }
          else if (!canSort) {
            rootEl.appendChild(dragEl);
          }

          return;
        }

        if ((el.children.length === 0) || (el.children[0] === ghostEl) ||
          (el === e.target) && (this._ghostIsLast(el, e))
        ) {
          //assign target only if condition is true
          if (el.children.length !== 0 && el.children[0] !== ghostEl && el === e.target) {
            target = el.lastElementChild;
          }

          if (target) {
            if (target.animated) {
              return;
            }

            targetRect = target.getBoundingClientRect();
          }

          _cloneHide(activeSortable, rootEl, cloneEl, dragEl, isOwner);

          if (this._onMove(rootEl, el, dragEl, dragRect, target, targetRect, e) !== false) {
            if (!dragEl.contains(el)) {
              el.appendChild(dragEl);
              parentEl = el; // actualization
            }

            this._animate(dragRect, dragEl);
            target && this._animate(targetRect, target);
          }
        }
        else if (target && !target.animated && target !== dragEl && (target.parentNode.sortableInstance !== void 0)) {
          if (lastEl !== target) {
            lastEl = target;
            lastCSS = _css(target);
            lastParentCSS = _css(target.parentNode);
          }

          targetRect = target.getBoundingClientRect();

          var width = targetRect.right - targetRect.left,
            height = targetRect.bottom - targetRect.top,
            floating = R_FLOAT.test(lastCSS.cssFloat + lastCSS.display)
              || (lastParentCSS.display == 'flex' && lastParentCSS['flex-direction'].indexOf('row') === 0),
            isWide = (target.offsetWidth > dragEl.offsetWidth),
            isLong = (target.offsetHeight > dragEl.offsetHeight),
            halfway = (floating ? (e.clientX - targetRect.left) / width : (e.clientY - targetRect.top) / height) > 0.5,
            nextSibling = target.nextElementSibling,
            after = false
          ;

          if (floating) {
            var elTop = dragEl.offsetTop,
              tgTop = target.offsetTop;

            if (elTop === tgTop) {
              after = (target.previousElementSibling === dragEl) && !isWide || halfway && isWide;
            }
            else if (target.previousElementSibling === dragEl || dragEl.previousElementSibling === target) {
              after = (e.clientY - targetRect.top) / height > 0.5;
            } else {
              after = tgTop > elTop;
            }
            } else if (!isMovingBetweenSortable) {
            after = (nextSibling !== dragEl) && !isLong || halfway && isLong;
          }

          var moveVector = this._onMove(rootEl, el, dragEl, dragRect, target, targetRect, e, after);

          if (moveVector !== false) {
            if (moveVector === 1 || moveVector === -1) {
              after = (moveVector === 1);
            }

            _silent = true;
            setTimeout(function () { _silent = false }, 30)

            _cloneHide(activeSortable, rootEl, cloneEl, dragEl, isOwner);

            if (!dragEl.contains(el)) {
              if (after && !nextSibling) {
                el.appendChild(dragEl);
              } else {
                target.parentNode.insertBefore(dragEl, after ? nextSibling : target);
              }
            }

            parentEl = dragEl.parentNode; // actualization

            this._animate(dragRect, dragEl);
            this._animate(targetRect, target);
          }
        }
      }
    }
    this._animate = function (prevRect, target) {
      var ms = this.options.animation;

      if (ms) {
        var currentRect = target.getBoundingClientRect();

        if (prevRect.nodeType === 1) {
          prevRect = prevRect.getBoundingClientRect();
        }

        _css(target, 'transition', 'none');
        _css(target, 'transform', 'translate3d('
          + (prevRect.left - currentRect.left) + 'px,'
          + (prevRect.top - currentRect.top) + 'px,0)'
        );

        forRepaintDummy = target.offsetWidth; // repaint

        _css(target, 'transition', 'all ' + ms + 'ms');
        _css(target, 'transform', 'translate3d(0,0,0)');

        clearTimeout(target.animated);
        target.animated = setTimeout(function () {
          _css(target, 'transition', '');
          _css(target, 'transform', '');
          target.animated = false;
        }, ms);
      }
    }
    this._offUpEvents = function () {
      var ownerDocument = this.el.ownerDocument;

      _off(doc, 'touchmove', this._onTouchMove);
      _off(doc, 'pointermove', this._onTouchMove);
      _off(ownerDocument, 'mouseup', this._onDrop);
      _off(ownerDocument, 'touchend', this._onDrop);
      _off(ownerDocument, 'pointerup', this._onDrop);
      _off(ownerDocument, 'touchcancel', this._onDrop);
      _off(ownerDocument, 'pointercancel', this._onDrop);
      _off(ownerDocument, 'selectstart', this);
    }
    this._onDrop = function (e) {
      var el = this.el,
        options = this.options;

      clearInterval(this._loopId);
      clearInterval(autoScroll.pid);
      clearTimeout(this._dragStartTimer);

      _cancelNextTick(this._cloneId);
      _cancelNextTick(this._dragStartId);

      // Unbind events
      _off(doc, 'mouseover', this);
      _off(doc, 'mousemove', this._onTouchMove);

      if (this.nativeDraggable) {
        _off(doc, 'drop', this);
        _off(el, 'dragstart', this._onDragStart);
      }

      this._offUpEvents();

      if (e) {
        if (moved) {
          e.preventDefault();
          !options.dropBubble && e.stopPropagation();
        }

        ghostEl && ghostEl.parentNode && ghostEl.parentNode.removeChild(ghostEl);

        if (rootEl === parentEl || activeSortableItem.lastPullMode !== 'clone') {
          // Remove clone
          cloneEl && cloneEl.parentNode && cloneEl.parentNode.removeChild(cloneEl);
        }

        if (dragEl) {
          if (this.nativeDraggable) {
            _off(dragEl, 'dragend', this);
          }

          _disableDraggable(dragEl);
          dragEl.style['will-change'] = '';

          // Remove class's
          _toggleClass(dragEl, this.options.ghostClass, false);
          _toggleClass(dragEl, this.options.chosenClass, false);

          // Drag stop event
          _dispatchEvent(this, rootEl, cloneEl, 'unchoose', dragEl, parentEl, rootEl, oldIndex, null, e);

          if (rootEl !== parentEl) {
            newIndex = _index(dragEl, options.draggable);

            if (newIndex >= 0) {
              // Add event
              _dispatchEvent(null, parentEl, cloneEl, 'add', dragEl, parentEl, rootEl, oldIndex, newIndex, e);

              // Remove event
              _dispatchEvent(this, rootEl, cloneEl, 'remove', dragEl, parentEl, rootEl, oldIndex, newIndex, e);

              // drag from one list and drop into another
              _dispatchEvent(null, parentEl, cloneEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, e);
              _dispatchEvent(this, rootEl, cloneEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, e);
            }
          }
          else {
            if (dragEl.nextSibling !== nextEl) {
              // Get the index of the dragged element within its parent
              newIndex = _index(dragEl, options.draggable);

              if (newIndex >= 0) {
                // drag & drop within the same list
                _dispatchEvent(this, rootEl, cloneEl, 'update', dragEl, parentEl, rootEl, oldIndex, newIndex, e);
                _dispatchEvent(this, rootEl, cloneEl, 'sort', dragEl, parentEl, rootEl, oldIndex, newIndex, e);
              }
            }
          }

          if (activeSortableItem) {
            /* jshint eqnull:true */
            if (newIndex == null || newIndex === -1) {
              newIndex = oldIndex;
            }

            _dispatchEvent(this, rootEl, cloneEl, 'end', dragEl, parentEl, rootEl, oldIndex, newIndex, e);

            // Save sorting
            this.save();
          }
        }

      }

      this._nulling();
    }
    this._nulling = function() {
      rootEl =
      dragEl =
      parentEl =
      ghostEl =
      nextEl =
      cloneEl =
      lastDownEl =

      scrollEl =
      scrollParentEl =

      tapEvt =
      touchEvt =

      moved =
      newIndex =

      lastEl =
      lastCSS =

      putSortable =
      activeGroup =
      activeSortableItem = null;

      savedInputChecked.forEach(function (el) {
        el.checked = true;
      });
      savedInputChecked.length = 0;
    }
    this.handleEvent = function (e) {
      switch (e.type) {
        case 'drop':
        case 'dragend':
          this._onDrop(e);
          break;

        case 'dragover':
        case 'dragenter':
          if (dragEl) {
            this._onDragOver(e);
            _globalDragOver(e);
          }
          break;

        case 'mouseover':
          this._onDrop(e);
          break;

        case 'selectstart':
          e.preventDefault();
          break;
      }
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
          order.push(el.getAttribute(options.dataIdAttr) || _generateId(el));
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
      }, this);

      order.forEach(function (id) {
        if (items[id]) {
          rootEl.removeChild(items[id]);
          rootEl.appendChild(items[id]);
        }
      });
    }
    this.save = function () {
      var store = this.options.store;
      store && store.set(this);
    }
    this.closest = function (el, selector) {
      return _closest(el, selector || this.options.draggable, this.el);
    }
    this.option = function (name, value) {
      var options = this.options;

      if (value === void 0) {
        return options[name];
      } else {
        options[name] = value;

        if (name === 'group') {
          _prepareGroup(options);
        }
      }
    }
    this.destroy = function () {
      var el = this.el;

      el.sortableInstance = null;

      _off(el, 'mousedown', this._onTapStart);
      _off(el, 'touchstart', this._onTapStart);
      _off(el, 'pointerdown', this._onTapStart);

      if (this.nativeDraggable) {
        _off(el, 'dragover', this);
        _off(el, 'dragenter', this);
      }

      // Remove draggable attributes
      Array.prototype.forEach.call(el.querySelectorAll('[draggable]'), function (el) {
        el.removeAttribute('draggable');
      });

      touchDragOverListeners.splice(touchDragOverListeners.indexOf(this._onDragOver), 1);

      this._onDrop();

      this.el = el = null;
    }
    this._onMove = function (fromEl, toEl, dragEl, dragRect, targetEl, targetRect, originalEvt, willInsertAfter) {
      var e,
        sortable = fromEl.sortableInstance,
        onMoveFn = sortable.options.onMove,
        retVal;

      e = doc.createEvent('Event');
      e.initEvent('move', true, true);

      e.to = toEl;
      e.from = fromEl;
      e.dragged = dragEl;
      e.draggedRect = dragRect;
      e.related = targetEl || toEl;
      e.relatedRect = targetRect || toEl.getBoundingClientRect();
      e.willInsertAfter = willInsertAfter;

      e.originalEvent = originalEvt;

      fromEl.dispatchEvent(e);

      if (onMoveFn) {
        retVal = onMoveFn.call(sortable, e, originalEvt);
      }

      return retVal;
    }
    this._ghostIsLast = function (el, e) {
      var lastEl = el.lastElementChild,
        rect = lastEl.getBoundingClientRect();

      // 5 — min delta
      // abs — нельзя добавлять, а то глюки при наведении сверху
      return (e.clientY - (rect.top + rect.height) > 5) ||
        (e.clientX - (rect.left + rect.width) > 5);
    }
    this._saveInputCheckedState = function (root) {
      savedInputChecked.length = 0;

      var inputs = root.getElementsByTagName('input');
      var idx = inputs.length;

      while (idx--) {
        var el = inputs[idx];
        el.checked && savedInputChecked.push(el);
      }
    }

    // Root element
    this.el = el;
    this.options = options = _extend({}, options);

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
        dataTransfer.setData('Text', dragEl.textContent);
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
      !(name in options) && (options[name] = defaults[name]);
    }

    _prepareGroup(options);

    // Bind all private methods
    for (var fn in this) {
      if (fn.charAt(0) === '_' && typeof this[fn] === 'function') {
        this[fn] = this[fn].bind(this);
      }
    }

    // Setup drag mode
    const supportDraggable = 'draggable' in newTag('div')
    this.nativeDraggable = options.forceFallback ? false : supportDraggable;

    // Bind events
    _on(el, 'mousedown', this._onTapStart);
    _on(el, 'touchstart', this._onTapStart);

    options.supportPointer && _on(el, 'pointerdown', this._onTapStart);

    if (this.nativeDraggable) {
      _on(el, 'dragover', this);
      _on(el, 'dragenter', this);
    }

    touchDragOverListeners.push(this._onDragOver);

    // Restore sorting
    options.store && this.sort(options.store.get(this));
  }

  // Fixed #973:
  _on(doc, 'touchmove', function (e) {
    if (activeSortableItem) {
      e.preventDefault();
    }
  });

  return initialize;
})()

Sortable.version = '1.7.1'

export default Sortable
