var SortableCurrentState = (function () {
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

  const destroy = function () {
    rootEl =
    draggableItem =
    parentEl =
    ghostEl =
    nextEl =
    cloneEl =
    lastDownEl =
    scrollParentEl =
    moved =
    newIndex =
    oldIndex =
    activeGroup =
    lastEl =
    putSortable =
    activeSortableItem = null;

    tapEvt =
    touchEvt = null;

    savedInputChecked.forEach(function (el) {
      el.checked = true;
    })

    savedInputChecked.length = 0

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

    destroy: destroy
  }
})()

export default SortableCurrentState
