import React from 'react'
import ReactDOM from 'react-dom'

import { log } from './shared/helpers'

import SortableTree from './sortableTree'

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      helloText: 'Hello from sortableTree',
      amount: 3
    }

    // Bind handlers to the context
    this.onClickAddNode = this.onClickAddNode.bind(this)
    this.onClickRemoveNode = this.onClickRemoveNode.bind(this)
  }

  onClickAddNode() {
    this.setState({ amount: this.state.amount + 1 })
  }

  onClickRemoveNode() {
    this.setState({ amount: this.state.amount - 1 })
  }

  render() {
    return <div>
      <h1>{this.state.helloText} {this.state.amount}</h1>

      <SortableTree nodesAmount={this.state.amount} />

      <button onClick={this.onClickAddNode}>Add Node</button>
      <button onClick={this.onClickRemoveNode}>Remove Node</button>
    </div>;
  }
}

export default App
