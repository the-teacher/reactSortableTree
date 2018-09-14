import React from 'react'
import ReactDOM from 'react-dom'
import { log } from './shared/helpers'

class App extends React.Component {
  buttonOnClick() {
    log('The button was clicked')
    return false
  }

  render() {
    return <div>
      <h1>Hello from sortableTree</h1>
      <button onClick={this.buttonOnClick}>Hello World!</button>
    </div>;
  }
}

export default App
