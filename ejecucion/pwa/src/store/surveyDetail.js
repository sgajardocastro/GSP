// stores/surveyDetail.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSurveyDetailStore = defineStore('surveyDetail', () => {
  const surveyDetail = ref([])

  return {
    surveyDetail,
  }
}, {
  persist: true,
})