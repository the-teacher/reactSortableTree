import React from 'react'
import ReactDOM from 'react-dom'
import SortableTreeNode from './sortable_tree_node'

class SortableTree extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return <div>
      <SortableTreeNode nodesAmount={this.props.nodesAmount}/>
    </div>
  }
}

export default SortableTree
