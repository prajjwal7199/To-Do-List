import { configureStore } from '@reduxjs/toolkit'
import tasksReducer from './slices/tasksSlice'
import productivityReducer from './slices/productivitySlice'

export const store = configureStore({
  reducer: {
    tasks: tasksReducer as any,
    productivity: productivityReducer as any
  }
})

// Firestore synchronization is handled in `src/firebase.ts` which will
// listen for remote state and persist local changes. Keep the store simple.

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
