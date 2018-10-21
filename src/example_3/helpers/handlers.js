import { win, doc } from './base'
import { _toggleClass, _css, _find } from './css'
import { _on, _dispatchEvent } from './events'

import {
  _nextTick
} from './utils'

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

const _triggerDragStart = function (sortable, sortableStateObj, e, touch) {
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

    sortable._onDragStart(sortableStateObj.tapEvt, 'touch')
  }
  else if (!sortable.nativeDraggable) {
    sortable._onDragStart(sortableStateObj.tapEvt, true)
  }
  else {
    _on(dragEl, 'dragend', sortable)
    _on(rootEl, 'dragstart', sortable._onDragStart)
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

export {
  dragStartFn
}
