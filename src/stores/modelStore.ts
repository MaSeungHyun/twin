import { create } from 'zustand'

import {
  DEFAULT_MODEL_ID,
  MODEL_OPTIONS,
  type ModelId,
  getModelUrl,
} from '@/assets/model'

interface ModelState {
  selectedModelId: ModelId
  selectedUrl: string
  selectModel: (id: ModelId) => void
}

export const useModelStore = create<ModelState>((set) => ({
  selectedModelId: DEFAULT_MODEL_ID,
  selectedUrl: getModelUrl(DEFAULT_MODEL_ID),
  selectModel: (id) =>
    set({
      selectedModelId: id,
      selectedUrl: getModelUrl(id),
    }),
}))

export { MODEL_OPTIONS }
