const getById = (id) => document.getElementById(id)
const setAttr = (item, attr, value) => item.setAttribute(attr, value)
const itsDraggable = (item, value) => setAttr(item, 'draggable', value)
const log = function() { console.log.apply(console, arguments) }

module.exports = {
  getById: getById,
  setAttr: setAttr,
  itsDraggable: itsDraggable,
  log: log
}
