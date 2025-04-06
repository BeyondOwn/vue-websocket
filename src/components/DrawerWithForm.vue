<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toTypedSchema } from '@vee-validate/zod'
import { ref } from 'vue'

// Define the emit for the submit event
const emit = defineEmits<{
  // eslint-disable-next-line
  submit: [values: any]
}>()

// Define props with all customizable elements
const props = defineProps<{
  classTrigger?: string | string[]
  class?: string | string[]
  typedSchema: ReturnType<typeof toTypedSchema>
  triggerButtonText?: string
  dialogTitle?: string
  dialogDescription?: string
  fieldLabel?: string
  fieldPlaceholder?: string
  fieldName?: string
  submitButtonText?: string
}>()

// Set default values for props
const triggerText = props.triggerButtonText || 'Join Server'
const title = props.dialogTitle || 'Join new Server'
const description = props.dialogDescription || 'Join a new server with an invite code.'
const label = props.fieldLabel || 'Invite Code'
const placeholder = props.fieldPlaceholder || 'shadcn'
const fieldName = props.fieldName || 'inviteCode'
const submitText = props.submitButtonText || 'Join'

// Handle the dialog state
const isOpen = ref(false)

// Create a wrapper function that will emit the event with the full values object
// eslint-disable-next-line
const handleFormSubmit = (values: any) => {
  console.log('Form submitted with values:', values)
  console.log('Field name being used:', fieldName)
  console.log('Value for this field:', values[fieldName])

  // Emit the submit event with the values
  emit('submit', values)

  // Automatically close the dialog on submission
  isOpen.value = false
}
</script>

<template>
  <Form v-slot="{ handleSubmit }" as="" keep-values :validation-schema="props.typedSchema">
    <Dialog v-model:open="isOpen">
      <DialogTrigger as-child>
        <Button variant="default" :class="['font-poppins', props.classTrigger]">
          {{ triggerText }}
        </Button>
      </DialogTrigger>
      <DialogContent :class="['sm:max-w-[425px]', props.class]">
        <DialogHeader class="font-poppins">
          <DialogTitle>{{ title }}</DialogTitle>
          <DialogDescription>{{ description }}</DialogDescription>
        </DialogHeader>

        <form id="dialogForm" @submit="handleSubmit($event, handleFormSubmit)">
          <FormField v-slot="{ componentField }" :name="fieldName">
            <FormItem>
              <FormLabel error-class="text-red-700 font-poppins">{{ label }}</FormLabel>
              <FormControl>
                <Input type="text" class="font-poppins" :placeholder="placeholder" v-bind="componentField" />
              </FormControl>
              <FormMessage class="text-red-700 font-poppins" />
            </FormItem>
          </FormField>
        </form>

        <DialogFooter>
          <Button class="text-secondary font-poppins" type="submit" form="dialogForm">{{ submitText }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </Form>
</template>
