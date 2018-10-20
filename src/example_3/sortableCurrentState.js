const SortableCurrentState = (function () {
  var
    rootEl,
    draggableItem,
    parentEl,
    ghostEl,
    nextEl,
    cloneEl,
    lastDownEl,
    scrollParentEl,
    moved,
    newIndex,
    oldIndex,
    activeGroup,
    lastEl,
    putSortable,
    activeSortableItem,
    tapEvt,
    touchEvt;

  var
    silent = false,
    autoScroll = {},
    savedInputChecked = [],
    touchDragOverListeners = [];

  const reset = function () {
    this.rootEl =
    this.draggableItem =
    this.parentEl =
    this.ghostEl =
    this.nextEl =
    this.cloneEl =
    this.lastDownEl =
    this.scrollParentEl =
    this.moved =
    this.newIndex =
    this.oldIndex =
    this.activeGroup =
    this.lastEl =
    this.putSortable =
    this.activeSortableItem = null;

    this.tapEvt =
    this.touchEvt = null;

    this.savedInputChecked.forEach(function (el) {
      el.checked = true;
    })

    this.savedInputChecked.length = 0

    return true
  }

  return {
    rootEl: rootEl,
    draggableItem: draggableItem,
    parentEl: parentEl,
    ghostEl: ghostEl,
    nextEl: nextEl,
    cloneEl: cloneEl,
    lastDownEl: lastDownEl,
    scrollParentEl: scrollParentEl,
    moved: moved,
    newIndex: newIndex,
    newIndex: oldIndex,
    activeSortableItem: activeSortableItem,
    lastEl: lastEl,
    putSortable: putSortable,
    activeGroup: activeGroup,

    silent: silent,
    autoScroll: autoScroll,
    savedInputChecked: savedInputChecked,
    touchDragOverListeners: touchDragOverListeners,

    tapEvt: tapEvt,
    touchEvt: touchEvt,

    reset: reset
  }
})()

export default SortableCurrentState
