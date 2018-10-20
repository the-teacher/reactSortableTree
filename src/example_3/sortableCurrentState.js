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
    moved =
    newIndex =
    oldIndex =
    activeGroup =

    lastEl =
    putSortable =

    tapEvt =
    touchEvt =
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
    moved: moved,
    newIndex: newIndex,
    newIndex: oldIndex,
    activeSortableItem: activeSortableItem,

    lastEl: lastEl,
    putSortable: putSortable,
    activeGroup: activeGroup,
    tapEvt: tapEvt,
    touchEvt: touchEvt,

    silent: silent,
    autoScroll: autoScroll,
    savedInputChecked: savedInputChecked,
    touchDragOverListeners: touchDragOverListeners,

    destroy: destroy
  }
})()

export default SortableCurrentState
