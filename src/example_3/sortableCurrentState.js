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
    tapEvt,
    touchEvt,
    moved,
    newIndex,
    lastEl,
    putSortable,
    activeGroup,
    activeSortableItem;

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
    tapEvt =
    touchEvt =
    moved =
    newIndex =
    lastEl =
    putSortable =
    activeGroup =
    activeSortableItem;

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
    tapEvt: tapEvt,
    touchEvt: touchEvt,
    moved: moved,
    newIndex: newIndex,
    lastEl: lastEl,
    putSortable: putSortable,
    activeGroup: activeGroup,
    activeSortableItem: activeSortableItem,

    silent: silent,
    autoScroll: autoScroll,
    savedInputChecked: savedInputChecked,
    touchDragOverListeners: touchDragOverListeners,

    destroy: destroy
  }
})()

export default SortableCurrentState
