<script setup lang="ts">
import { ref } from 'vue'

const text = ref('')

const mock = [
  'heyaa',
  'bruv',
  're',
  'Etc',
  'heyaa',
  'bruv',
  're',
  'Etc',
  'heyaa',
  'bruv',
  're',
  'Etc',
  'heyaa',
  'bruv',
  're',
  'Etc',
]
</script>

<template>
  <main class="min-h-[calc(100vh-20px)] border-1 border-red-500 grid grid-rows-6 grid-cols-6">
    <!-- Messages -->
    <div class="col-span-5 row-span-5 border-1 border-blue-500">
      <div class="pl-1 flex flex-col" v-for="(message, index) in mock" :key="index">
        {{ message }}
      </div>
    </div>
    <!-- Users-->
    <div class="col-span-1 row-span-6 border-1 border-purple-500">
      <div class="p-2 flex flex-col">
        <p>Beyondu</p>
        <p>Whatever</p>
      </div>
    </div>
    <!-- Input -->
    <div class="col-span-5 border-2 border-green-700">
      <div class="h-full w-[100%] flex flex-row">
        <form class="w-[90%] border-1 border-orange-600">
          <input class="w-full h-full" v-model="text" placeholder="type a message" />
        </form>
        <!-- button submit -->
        <div class="w-[10%] border-1 border-white">Submit</div>
      </div>
    </div>
  </main>
</template>
