import './css/styles'
import Sortable from './sortable'
import { getById } from '../shared/helpers'

// Simple 1
console.log(Sortable.version) 

new Sortable(getById('sortable-1'), {
  handle: '.drag-handle',
  animation: 150
})

// Advanced

const array = [{
  name: 'advanced',
  pull: true,
  put: true
}, {
  name: 'advanced',
  pull: 'clone',
  put: false
}, {
  name: 'advanced',
  pull: false,
  put: true
}]

array.forEach(function (groupOpts, i) {
  new Sortable(getById('advanced-' + (i + 1)), {
    sort: (i != 1),
    group: groupOpts,
    animation: 150
  })
})
