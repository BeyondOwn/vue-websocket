<script setup lang="ts">
import { useUploadThing } from '@/lib/uploadthing' // Adjust path if needed
import { ref, watch } from 'vue'

// --- Props ---
const props = defineProps<{
  endpoint: string // Pass the upload endpoint from the parent
  show: boolean // Control modal visibility from parent
  startUpload: boolean
}>()

watch(
  () => props.startUpload,
  () => {
    if (props.startUpload == true) {
      uploadFiles()
    }
  },
)

// --- Emits ---
const emit = defineEmits<{
  // eslint-disable-next-line
  (e: 'uploadComplete', result: any): void
  (e: 'uploadError', error: Error): void
  (e: 'close'): void // To tell the parent to close the modal
  // eslint-disable-next-line
  (e: 'fileReady', file: any): void
  (e: 'fileClear'): void
  (e: 'uploading'): void
}>()

// --- Refs ---
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const files = ref<File[]>([])
const uploadError = ref<string | null>(null) // To display errors within the modal

// --- UploadThing Hook ---
const { startUpload } = useUploadThing(props.endpoint, {
  onClientUploadComplete: (res) => {
    emit('uploadComplete', res)
    files.value = [] // Clear files
    uploadError.value = null
    isUploading.value = false
    emit('close') // Close modal on success
  },
  onUploadError: (error: Error) => {
    console.error('Upload error:', error)
    emit('uploadError', error)
    uploadError.value = `Upload Failed: ${error.message}` // Show error in modal
    isUploading.value = false
    // Keep modal open on error for user to see message / retry?
  },
  onUploadProgress: (progress) => {
    console.log('Upload Progress:', progress)
    // Potential place for progress bar logic
  },
})

// --- Event Handlers ---

// Open file dialog (triggered by button OR dropzone click)
const openFileDialog = () => {
  // Don't open if currently uploading
  if (isUploading.value) return
  fileInputRef.value?.click()
}

// Handle file selection from input
const handleFileChange = (event: Event) => {
  uploadError.value = null // Clear previous errors
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    files.value = Array.from(input.files)
    emit('fileReady', files.value)
  }
  // Clear the input value so selecting the same file again triggers 'change'
  if (input) input.value = ''
}

// Handle drag events
const handleDragEnter = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  // Don't indicate drop if uploading
  if (!isUploading.value) {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    isDragging.value = true
  } else {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
  }
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  // Check if the element being left is actually the dropzone itself
  // or if the mouse moved onto a child element within the dropzone.
  // Using relatedTarget is more robust if available.
  const dropzoneElement = e.currentTarget as HTMLElement
  const relatedTarget = e.relatedTarget as Node | null

  if (relatedTarget === null || !dropzoneElement.contains(relatedTarget)) {
    isDragging.value = false
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault() // Crucial to allow dropping
  e.stopPropagation()
  if (!isUploading.value) {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    isDragging.value = true // Ensure it stays true while over
  } else {
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'none' // Disallow drop during upload
  }
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = false
  if (isUploading.value) return // Ignore drop if uploading

  uploadError.value = null // Clear previous errors

  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    files.value = Array.from(e.dataTransfer.files)
    emit('fileReady', files.value)
  } else {
    console.warn('No files found in dataTransfer object during drop.')
  }
}

// --- NEW: Remove selected files ---
const removeSelectedFiles = () => {
  files.value = []
  uploadError.value = null
  emit('fileClear')
  // Also clear the hidden input's value
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Handle file upload action
const uploadFiles = async (e?: Event) => {
  if (e) {
    e.stopPropagation() // Prevent event bubbling if called from button click
  }
  if (files.value.length === 0 || isUploading.value) return

  uploadError.value = null
  isUploading.value = true
  emit('uploading')

  try {
    await startUpload(files.value)
    // Callbacks (onClientUploadComplete/onUploadError) handle the rest
  } catch (error) {
    console.error('Error initiating upload:', error)
    uploadError.value = `Error starting upload: ${(error as Error).message}`
    emit('uploadError', error as Error)
    isUploading.value = false // Ensure uploading is reset on initial error
  }
}

// --- Watcher to clear files if modal is hidden ---
watch(
  () => props.show,
  (newValue) => {
    if (!newValue) {
      // Reset state when modal is hidden (optional: keep files?)
      // files.value = []; // Uncomment to clear files on close
      isDragging.value = false
      isUploading.value = false
      uploadError.value = null
    }
  },
)

// --- Close Modal Handler ---
const closeModal = () => {
  // Optional: Prevent closing during upload?
  // if (isUploading.value) {
  //   alert("Upload in progress. Please wait.");
  //   return;
  // }
  emit('close')
}
</script>

<template>
  <teleport to="body">
    <div v-if="show" @click.self="closeModal" class="fixed inset-0 w-full h-full bg-black/80 flex justify-center items-center z-50 p-4">
      <div @click.stop class="bg-background p-6 rounded-lg shadow-xl min-w-[300px] max-w-[95%] w-[550px] relative max-h-[90vh] overflow-y-auto flex flex-col">
        <button @click="closeModal" class="absolute top-2 right-2 bg-transparent border-none text-2xl leading-none text-gray-500 hover:text-gray-800 cursor-pointer p-1 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full" aria-label="Close modal">&times;</button>

        <h2 class="mb-5 text-center text-xl font-semibold font-poppins text-foreground">Upload Files</h2>

        <input ref="fileInputRef" type="file" @change="handleFileChange" class="hidden" multiple :disabled="isUploading" accept="image/*" />

        <div
          @click="openFileDialog"
          @dragenter.prevent="handleDragEnter"
          @dragover.prevent="handleDragOver"
          @dragleave="handleDragLeave"
          @drop.prevent="handleDrop"
          class="mt-1 border-2 border-dashed rounded-lg p-8 text-center flex-grow flex flex-col justify-center items-center"
          :class="{
            'border-primary bg-card cursor-pointer hover:bg-card/85': !isUploading && isDragging,
            'border-gray-300 bg-card cursor-pointer hover:bg-card/85': !isUploading && !isDragging,
            'border-gray-400 bg-card cursor-not-allowed': isUploading,
          }"
        >
          <div v-if="files.length === 0 && !isUploading" class="text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="font-poppins mt-2">Drag & drop files here</p>
            <p class="font-poppins text-sm text-foreground/60">or click to select</p>
          </div>

          <div v-else-if="isUploading" class="text-foreground">
            <svg class="animate-spin mx-auto h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-2 font-medium">Uploading...</p>
          </div>

          <div v-else class="mt-4 w-full px-4">
            <p class="font-medium text-foreground font-poppins mb-2">Selected files:</p>
            <ul class="list-none text-left text-sm max-h-32 overflow-y-auto border rounded p-2 bg-background">
              <li v-for="file in files" :key="file.name + '-' + file.lastModified" class="font-poppins text-foreground truncate py-1">{{ file.name }} ({{ (file.size / 1024).toFixed(2) }} KB)</li>
            </ul>
          </div>
        </div>
        <div v-if="files.length > 0 && !isUploading" class="mt-5 flex justify-end space-x-3">
          <button type="button" @click.stop="removeSelectedFiles" class="px-4 py-2 rounded text-foreground bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 transition duration-150 ease-in-out">Remove</button>
          <button type="button" @click="uploadFiles" class="px-4 py-2 rounded text-foreground bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition duration-150 ease-in-out">
            {{ `Upload ${files.length} File(s)` }}
          </button>
        </div>

        <div v-if="files.length === 0 && !isUploading" class="mt-5 text-center">
          <button type="button" @click="openFileDialog" class="text-secondary px-5 py-2 rounded font-poppins bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out" :disabled="isUploading">Select Files</button>
        </div>

        <p v-if="uploadError" class="mt-4 text-center text-red-600 text-sm font-medium">{{ uploadError }}</p>
      </div>
    </div>
  </teleport>
</template>
