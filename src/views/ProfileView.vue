<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import { useAuth } from '@/lib/authContext'
import api from '@/lib/axios'
import { useUploadThing } from '@/lib/uploadthing'
import { useTheme } from '@/lib/UseTheme'
import type { User } from '@/models/models'
import { ref } from 'vue'
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { toast, type ToastTheme } from 'vue3-toastify'

const { theme } = useTheme()
const { user, setAuthData } = useAuth()
// --- Props ---
// const props = defineProps<{
//   endpoint: string // Pass the upload endpoint from the parent
// }>()

// --- Emits ---
const emit = defineEmits<{
  // eslint-disable-next-line
  (e: 'uploadComplete', result: any): void
  (e: 'uploadError', error: Error): void
}>()

const cropperRef = ref(null)
const imgUrl = ref<string | null>('')
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const cropperKey = ref(0)

const handleChangeProfilePicture = async (picture: string, user: User) => {
  const changeProfilePicture = await api.post('/change-profile-picture', { picture, user })
  console.log(changeProfilePicture.data)
  const token = localStorage.getItem('token')
  setAuthData(token!, changeProfilePicture.data)
  return changeProfilePicture.data
}

// --- UploadThing Hook ---
const { startUpload } = useUploadThing('profilePicture', {
  onClientUploadComplete: (file) => {
    isUploading.value = false
    uploadError.value = null
    imgUrl.value = null
    fileInput.value = null
    cropperKey.value++
    console.log(file[0])
    handleChangeProfilePicture(file[0].ufsUrl, user.value!)
    toast(`Profile Picture changed successfully!`, { autoClose: 5000, type: 'success', position: 'bottom-right', theme: theme.value as ToastTheme })
    emit('uploadComplete', file)
  },
  onUploadError: (error: Error) => {
    isUploading.value = false
    uploadError.value = `Upload Failed: ${error.message}`
    emit('uploadError', error)
  },
  onUploadProgress: (progress) => {
    console.log('Upload Progress:', progress)
  },
})

function ready() {
  console.log('Cropper is ready')
}

function openFileChooser() {
  fileInput?.value?.click()
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    imgUrl.value = URL.createObjectURL(file)
  }
}

async function uploadCroppedImage() {
  if (!cropper) return

  isUploading.value = true
  uploadError.value = null

  try {
    const cropperFile = await cropper.getFile()
    if (cropperFile) {
      // Create a File object from the Blob
      const file = new File([cropperFile], 'cropped-image.png', { type: 'image/png' })
      const result = await startUpload([file])
      console.log('Fille uploaded: ', result)
    } else {
      uploadError.value = 'Failed to get cropped image blob.'
      isUploading.value = false
    }
  } catch (error) {
    console.error('Error uploading cropped image:', error)
    uploadError.value = `Upload Error: ${(error as Error).message}`
    isUploading.value = false
  }
}
</script>

<template>
  <div class="font-poppins">
    <Button class="text-secondary" @click="openFileChooser">Choose Image</Button>
    <input type="file" ref="fileInput" style="display: none" @change="onFileChange" accept="image/*" />
    <VuePictureCropper
      v-if="imgUrl"
      key="cropperKey"
      ref="cropperRef"
      :boxStyle="{
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f8f8',
        margin: 'auto',
      }"
      :img="imgUrl!"
      :options="{
        viewMode: 1,
        dragMode: 'move',
        aspectRatio: 1,
        cropBoxResizable: false,
      }"
      :presetMode="{
        mode: 'round',
        width: 128,
        height: 128,
      }"
      @ready="ready"
    />
    <div class="mt-2 space-x-2">
      <Button class="text-secondary" :disabled="isUploading" @click="uploadCroppedImage">
        {{ isUploading ? 'Uploading...' : 'Upload Cropped Image' }}
      </Button>
      <Button @click="() => (imgUrl = null)" variant="destructive">Close</Button>
    </div>
    <p v-if="uploadError" class="mt-4 text-center text-red-600 text-sm font-medium">{{ uploadError }}</p>
  </div>
</template>
