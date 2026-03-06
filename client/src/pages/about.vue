<script setup lang="ts">
import { useRouter } from 'vue-router'
import { definePage } from 'vue-router/experimental'

definePage({ meta: { layout: 'full' } })

const router = useRouter()
router.replace('/space/about')
</script>

<template></template>
