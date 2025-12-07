import { configureStore } from '@reduxjs/toolkit'
import tasksReducer from './slices/tasksSlice'
import productivityReducer from './slices/productivitySlice'
import { loadState, saveState } from '../utils/localStorage'

const preloadedTasks = loadState('tasks')
const preloadedProductivity = loadState('productivity')

export const store = configureStore({
  reducer: {
    tasks: tasksReducer as any,
    productivity: productivityReducer as any
  },
  preloadedState: {
    tasks: preloadedTasks || undefined,
    productivity: preloadedProductivity || undefined
  }
})

store.subscribe(() => {
  try {
    saveState('tasks', (store.getState() as any).tasks)
    saveState('productivity', (store.getState() as any).productivity)
  } catch (e) {
    // ignore
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
