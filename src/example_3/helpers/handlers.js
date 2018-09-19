import { win, doc } from './base'
import { _on } from './events'

const _triggerDragStart = function (/** Event */evt, /** Touch */touch, rootEl, dragEl) {
  touch = touch || (evt.pointerType == 'touch' ? evt : null);

  if (touch) {
    // Touch device support
    tapEvt = {
      target: dragEl,
      clientX: touch.clientX,
      clientY: touch.clientY
    };

    this._onDragStart(tapEvt, 'touch');
  }
  else if (!this.nativeDraggable) {
    this._onDragStart(tapEvt, true);
  }
  else {
    _on(dragEl, 'dragend', this);
    _on(rootEl, 'dragstart', this._onDragStart);
  }

  try {
    if (doc.selection) {
      // Timeout neccessary for IE9
      _nextTick(function () {
        doc.selection.empty();
      });
    } else {
      win.getSelection().removeAllRanges();
    }
  } catch (err) {
  }
}

export {
  _triggerDragStart
}
