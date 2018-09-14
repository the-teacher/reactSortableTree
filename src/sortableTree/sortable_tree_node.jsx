import React from 'react'
import ReactDOM from 'react-dom'
import SortableTreeNodeItem from './sortable_tree_node_item'

class SortableTreeNode extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      amount: props.nodesAmount
    }
  }

  componentWillReceiveProps(nextProps){
    this.setState({ amount: nextProps.nodesAmount })
  }

  itemsList (amount) {
    let list = []
    for(let i = 0; i < amount; i ++) {
      list.push(<SortableTreeNodeItem key={i.toString()}/>)
    }
    return list
  }

  render() {
    return <div>
      {this.itemsList(this.state.amount)}
    </div>
  }
}

export default SortableTreeNode
