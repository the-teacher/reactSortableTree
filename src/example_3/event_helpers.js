import { doc } from './helpers'

const captureMode = false

function _on(el, event, fn) {
  el.addEventListener(event, fn, captureMode);
}

function _off(el, event, fn) {
  el.removeEventListener(event, fn, captureMode);
}

function _dispatchEvent(sortable, cloneEl, rootEl, name, targetEl, toEl, fromEl, startIndex, newIndex, originalEvt) {
  sortable = (sortable || rootEl[expando]);

  var evt = doc.createEvent('Event'),
    options = sortable.options,
    onName = 'on' + name.charAt(0).toUpperCase() + name.substr(1);

  evt.initEvent(name, true, true);

  evt.to = toEl || rootEl;
  evt.from = fromEl || rootEl;
  evt.item = targetEl || rootEl;
  evt.clone = cloneEl;

  evt.oldIndex = startIndex;
  evt.newIndex = newIndex;

  evt.originalEvent = originalEvt;

  rootEl.dispatchEvent(evt);

  if (options[onName]) {
    options[onName].call(sortable, evt);
  }
}

export {
  _on,
  _off,
  _dispatchEvent
}
