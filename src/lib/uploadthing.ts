import { generateUploadButton, generateUploadDropzone, generateVueHelpers, type GenerateTypedHelpersOptions } from '@uploadthing/vue'
import { BACKEND } from './axios'

const initOpts = {
  url: `${BACKEND}/api/uploadthing`,
} satisfies GenerateTypedHelpersOptions

export const UploadButton = generateUploadButton(initOpts)
export const UploadDropzone = generateUploadDropzone(initOpts)

export const { useUploadThing } = generateVueHelpers(initOpts)
