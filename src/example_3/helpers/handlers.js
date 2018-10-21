import { win, doc, clone } from './base'
import { _toggleClass, _css, _find } from './css'
import { _on, _dispatchEvent } from './events'

import {
  _nextTick,
  getFirstSortableParent
} from './utils'

const resetSelection = function () {
  try {
    if (doc.selection) {
      // Timeout neccessary for IE9
      _nextTick(function () {
        doc.selection.empty()
      })
    } else {
      win.getSelection().removeAllRanges()
    }
  } catch (err) {}
}

// An order how handlers are being called
// 1. _prepareDragStart
// 2. dragStartFn
// 3. _triggerDragStart

// This method is being called on Drag Start
const dragStartFn = function (sortable, sortableStateObj, e, touch, options) {
  // Delayed drag has been triggered
  // we can re-enable the events: touchmove/mousemove
  sortable._disableDelayedDrag()

  // Make the element draggable
  sortableStateObj.draggableItem.draggable = sortable.nativeDraggable;

  // Chosen item
  _toggleClass(sortableStateObj.draggableItem, options.chosenClass, true)

  // Bind the events: dragstart/dragend
  _triggerDragStart(sortable, sortableStateObj, e, touch)

  // Drag start event
  _dispatchEvent(sortable, 'choose', sortableStateObj)
}

function _triggerDragStart (sortable, sortableStateObj, e, touch) {
  touch = touch || (e.pointerType == 'touch' ? e : null)

  const rootEl = sortableStateObj.rootEl
  const dragEl = sortableStateObj.draggableItem

  if (touch) {
    // Touch device support
    sortableStateObj.tapEvt = {
      target: dragEl,
      clientX: touch.clientX,
      clientY: touch.clientY
    };

    _onDragStart(sortableStateObj.tapEvt, 'touch', sortable, sortableStateObj)
  }
  else if (!sortable.nativeDraggable) {
    _onDragStart(sortableStateObj.tapEvt, true, sortable, sortableStateObj)
  }
  else {
    // save in a "global" variable
    // to remove the event handler later
    sortableStateObj.dragStartHandler = function(e) { _onDragStart(e, null, sortable, sortableStateObj) }

    _on(dragEl, 'dragend', sortable)
    _on(rootEl, 'dragstart', sortableStateObj.dragStartHandler)
  }

  resetSelection()
}

function _onDragStart (e, useFallback, sortable, sortableStateObj) {
  var el = getFirstSortableParent(e.target)

  var dataTransfer = e.dataTransfer
  var options = el.sortableInstance.options

  sortable._offUpEvents()

  var supportsGroupExchange = sortableStateObj.activeGroup.checkPull(sortable, sortable, sortableStateObj.draggableItem, e)

  if (supportsGroupExchange) {
    sortableStateObj.cloneEl = clone(sortableStateObj.draggableItem)

    sortableStateObj.cloneEl.draggable = false
    sortableStateObj.cloneEl.style['will-change'] = ''

    _css(sortableStateObj.cloneEl, 'display', 'none')
    _toggleClass(sortableStateObj.cloneEl, sortable.options.chosenClass, false)

    // #1143: IFrame support workaround
    // https://github.com/RubaXa/Sortable/pull/1143
    sortable._cloneId = _nextTick(function () {
      sortableStateObj.rootEl.insertBefore(sortableStateObj.cloneEl, sortableStateObj.draggableItem)
      _dispatchEvent(sortable, 'clone', sortableStateObj)
    })
  }

  _toggleClass(sortableStateObj.draggableItem, options.dragClass, true)

  if (useFallback) {
    if (useFallback === 'touch') {
      // Bind touch events
      _on(doc, 'touchmove', sortable._onTouchMove)
      _on(doc, 'touchend', sortable._onDrop)
      _on(doc, 'touchcancel', sortable._onDrop)

      if (options.supportPointer) {
        _on(doc, 'pointermove', sortable._onTouchMove)
        _on(doc, 'pointerup', sortable._onDrop)
      }
    } else {
      // Old brwoser
      _on(doc, 'mousemove', sortable._onTouchMove)
      _on(doc, 'mouseup', sortable._onDrop)
    }

    sortable._loopId = setInterval(sortable._emulateDragOver, 50)
  }
  else {
    if (dataTransfer) {
      dataTransfer.effectAllowed = 'move';
      options.setData && options.setData.call(sortable, dataTransfer, sortableStateObj.draggableItem)
    }

    _on(doc, 'drop', sortable)

    // https://github.com/RubaXa/Sortable/pull/1143
    // #1143: Бывает элемент с IFrame внутри блокирует `drop`,
    // поэтому если вызвался `mouseover`, значит надо отменять весь d'n'd.
    // Breaking Chrome 62+
    // _on(doc, 'mouseover', sortable)

    sortable._dragStartId = _nextTick(function () { sortable._dragStarted(e) })
  }
}

export {
  dragStartFn,
  _onDragStart
}
