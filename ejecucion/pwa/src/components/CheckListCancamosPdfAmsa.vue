<template><CheckListAmsaBase :attr="attr" :disabled="disabled" checklist-id="cancamosPdfAmsa" @change="$emit('change')" /></template>
<script setup>
import CheckListAmsaBase from './CheckListAmsaBase.vue'
defineProps({ attr: { type: Object, required: true }, disabled: { type: Boolean, default: false } })
defineEmits(['change'])
</script>
