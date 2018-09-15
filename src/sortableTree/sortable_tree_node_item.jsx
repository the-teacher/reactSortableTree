import React from 'react'
import ReactDOM from 'react-dom'
import styles from './css/sortable_tree'

class SortableTreeNodeItem extends React.Component {
  render() {
    return <div className={styles.item}>
      <b>SortableTreeNodeItem</b>
    </div>
  }
}

export default SortableTreeNodeItem
