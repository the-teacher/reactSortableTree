import React from 'react'
import ReactDOM from 'react-dom'

import { getById, log } from './shared/helpers'

log('Hello from sortableTree')
log(getById('appRoot'))

import App from './app'
ReactDOM.render(<App />, getById('appRoot'))
