import './css/styles'
import Sortable from './sortable'
import { getById } from '../shared/helpers'

Sortable.create(getById('sortable-1'), {
  handle: '.drag-handle',
  animation: 150
})
