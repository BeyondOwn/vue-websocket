<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { copyToClipboard } from '@/lib/copyToClipboard'
import { Copy } from 'lucide-vue-next'
import { computed } from 'vue'

// Define props with all customizable elements
const props = defineProps<{
  classTrigger?: string | string[]
  class?: string | string[]
  triggerButtonText?: string
  dialogTitle?: string
  dialogDescription?: string
  fieldLabel?: string
  link?: string
  disabled?: boolean[]
}>()

// Set default values for props
const triggerText = props.triggerButtonText || 'Share'
const title = props.dialogTitle || 'Share link'
const description = props.dialogDescription || 'Anyone who has this link will be able to view this.'
const label = props.fieldLabel || 'Link'
const link = computed(() => props.link) || 'Invite Code'
const disabled = computed(() => {
  return props.disabled?.some((prop) => prop === true)
})
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button :disabled="disabled" title="Share Invite Code" variant="outline" :class="[props.classTrigger]">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share-2">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
          <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
        </svg>
        <span>{{ triggerText }}</span>
      </Button>
    </DialogTrigger>
    <DialogContent :class="['sm:max-w-md', props.class]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex items-center space-x-2">
        <div class="grid flex-1 gap-2">
          <Label for="link" class="sr-only"> {{ label }} </Label>
          <Input id="link" :default-value="link" read-only />
        </div>
        <Button @click="copyToClipboard(link!)" type="submit" size="sm" class="px-3">
          <span class="sr-only">Copy</span>
          <Copy class="w-4 h-4" />
        </Button>
      </div>
      <DialogFooter class="sm:justify-start">
        <DialogClose as-child>
          <Button type="button" class="border border-white" variant="outline"> Close </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
