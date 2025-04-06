<script setup lang="ts">
import { Loader, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import Button from './ui/button/Button.vue'

async function dataUrlToObjectURL(dataUrl: File): Promise<string> {
  try {
    const blob = new Blob([dataUrl])
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error creating ObjectURL:', error)
    return '' // Or handle the error as needed
  }
}

const props = defineProps<{
  show: boolean
  img: File[]
  imagesLoading: boolean
  delete: (index: number) => void
}>()
const show = computed(() => props.show)
const image = computed(() => props.img)
const imageUrl = ref<string[]>([])
const imagesLoading = computed(() => props.imagesLoading)

watch(image, async () => {
  image.value.map(async (el, index) => {
    imageUrl.value![index] = await dataUrlToObjectURL(el)
  })
  console.log('imgurl', imageUrl)
})
</script>

<template>
  <div class="flex flex-row space-x-2 overflow-x-scroll items-center h-[250px] bg-muted border-foreground border-1 rounded-xl w-full mb-1 justify-start pl-4 pr-4" v-if="show">
    <div v-for="(file, index) in image" :key="index" class="flex-shrink-0 relative flex flex-col items-center justify-center w-[200px] h-[230px] bg-card rounded-xl p-2">
      <Loader class="animate-spin max-h-[150px] min-h-[150px] w-auto object-contain" v-if="imagesLoading" />
      <img v-else-if="imageUrl[index]" class="max-h-[150px] min-h-[150px] w-auto object-contain border-foreground border-1 rounded-xl" :src="imageUrl[index]" :alt="file.name" />
      <span class="font-poppins text-center text-base truncate w-full mt-auto font-medium">{{ file.name }}</span>
      <div class="absolute top-1 right-1">
        <Button title="Remove Preview" @click="props.delete(index)" class="w-8 h-8 bg-red-600 hover:bg-red-500 p-1"> <Trash2 class="w-full h-full" /> </Button>
      </div>
    </div>
  </div>
</template>
