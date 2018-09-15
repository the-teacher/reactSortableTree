import React from 'react'
import ReactDOM from 'react-dom'
import styles from './css/sortable_tree'
import { log, itsDraggable } from '../shared/helpers'

class SortableTreeNodeItem extends React.Component {
  constructor(props) {
    super(props)
    this.sortableItem = React.createRef()
  }

  componentDidMount() {
    const item = this.sortableItem.current
    itsDraggable(item, true)
  }

  render() {
    return <div ref={this.sortableItem} className={styles.item}>
      <b>SortableTreeNodeItem</b>
    </div>
  }
}

export default SortableTreeNodeItem
