<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { computed } from 'vue'

// Define props with all customizable elements
const props = defineProps<{
  classTrigger?: string | string[]
  class?: string | string[]
  triggerButtonText?: string
  dialogTitle?: string
  dialogDescription?: string
  button1text?: string
  button1class?: string
  button2text?: string
  button2class?: string
  fnc: () => void
  disabled?: boolean[]
}>()

// Set default values for props
const triggerText = computed(() => props.triggerButtonText || 'Share')
const title = props.dialogTitle || 'Share link'
const description = props.dialogDescription || 'Anyone who has this link will be able to view this.'
const button1text = props.button1text || 'Default button1 Text'
const button2text = props.button2text || 'Default button2 text'
console.log('prop disabled: ', props.disabled)
const disabled = computed(() => {
  return props.disabled?.some((prop) => prop === true)
})
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button :disabled="disabled" title="Leave Server" variant="outline" :class="['font-poppins', props.classTrigger]">
        <span class="sr-only">Leave Door</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-door-open-icon lucide-door-open">
          <path d="M13 4h3a2 2 0 0 1 2 2v14" />
          <path d="M2 20h3" />
          <path d="M13 20h9" />
          <path d="M10 12v.01" />
          <path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" />
        </svg>
        <span>{{ triggerText }}</span>
      </Button>
    </DialogTrigger>
    <DialogContent :class="['flex flex-col sm:max-w-md font-poppins', props.class]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          {{ description }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex items-center space-x-2">
        <div class="grid flex-1 gap-2">
          <!-- <Label for="link" class="sr-only"> {{ label }} </Label>
          <Input id="link" :default-value="link" read-only /> -->
        </div>
      </div>
      <DialogFooter class="sm:justify-start">
        <DialogClose as-child>
          <Button type="button" variant="outline" :class="['', props.button1class]"> {{ button1text }} </Button>
        </DialogClose>
        <DialogClose as-child>
          <Button @click="props.fnc" type="button" variant="outline" :class="['ml-auto', props.button2class]">{{ button2text }}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
