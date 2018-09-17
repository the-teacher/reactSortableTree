const getById = (id) => document.getElementById(id)
const setAttr = (item, attr, value) => item.setAttribute(attr, value)
const itsDraggable = (item, value) => setAttr(item, 'draggable', value)
const log = function() { console.log.apply(console, arguments) }
const on = (item, eventName, callback) => { item.addEventListener(eventName, callback, false) }
const addCssClass = (item, className) => item.classList.add(className)
const removeCssClass = (item, className) => item.classList.remove(className)

module.exports = {
  getById: getById,
  setAttr: setAttr,
  itsDraggable: itsDraggable,
  log: log,
  on: on,
  addCssClass: addCssClass,
  removeCssClass: removeCssClass
}
