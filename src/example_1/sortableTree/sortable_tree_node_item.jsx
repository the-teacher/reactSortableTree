import React from 'react'
import ReactDOM from 'react-dom'
import styles from './css/sortable_tree'
import { log, itsDraggable, on, addCssClass, removeCssClass } from '../../shared/helpers'

class SortableTreeNodeItem extends React.Component {
  constructor(props) {
    super(props)
    this.sortableItem = React.createRef()
  }

  componentDidMount() {
    const item = this.sortableItem.current
    itsDraggable(item, true)

    on(item, 'dragstart', (e) => {
      let clone = item.cloneNode(true)
      log(clone.outerHTML)

      addCssClass(item, styles.moving)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/html', '<div>Hello World!</div>')
    })

    on(item, 'drag', () => {
      log('drag')
    })

    on(item, 'dragenter', () => {
      log('dragenter')

      addCssClass(item, styles.over)
    })

    on(item, 'dragover', (e) => {
      log('dragover')

      // Allows us to drop.
      if (e.preventDefault) e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      return false
    })

    on(item, 'dragleave', () => {
      log('dragleave')

      removeCssClass(item, styles.over)
    })

    on(item, 'dragend', () => {
      log('dragend')

      removeCssClass(item, styles.over)
      removeCssClass(item, styles.moving)
    })

    //
    // on(item, 'dragexit', () => {
    //   log('dragexit')
    // })
    //
    // on(item, 'drop', () => {
    //   log('drop')
    // })
  }

  render() {
    return <div ref={this.sortableItem} className={styles.item}>
      <b>SortableTreeNodeItem</b>
    </div>
  }
}

export default SortableTreeNodeItem
