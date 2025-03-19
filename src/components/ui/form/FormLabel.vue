<script lang="ts" setup>
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { LabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { useFormField } from './useFormField'

const props = defineProps<LabelProps & { class?: HTMLAttributes['class']; errorClass?: string }>()

const { error, formItemId } = useFormField()
</script>

<template>
  <Label
    :class="
      cn(
        error && props.errorClass, // ✅ Uses prop value or default red
        props.class,
      )
    "
    :for="formItemId"
  >
    <slot />
  </Label>
</template>
