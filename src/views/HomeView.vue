<script setup lang="ts">
import DrawerWithForm from '@/components/DrawerWithForm.vue'
import Textarea from '@/components/ui/textarea/Textarea.vue'
import { useAuth } from '@/lib/authContext'
import api from '@/lib/axios'
import type { User } from '@/models/models'
import router from '@/router'
import { toTypedSchema } from '@vee-validate/zod'
import { io, Socket } from 'socket.io-client'
import { nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { toast } from 'vue3-toastify'
import { z } from 'zod'
import Button from '../components/ui/button/Button.vue'

interface activeSocketsInt {
  [socketId: string]: User
}

interface Message {
  content: string
  createdAt: Date
  userId: number
  channelId: number
  user?: User
}

interface getUsersInt {
  channels: {
    id: number
    name: string
    description: string | null
    createdAt: Date
    updatedAt: Date
    serverId: number
  }[]
  createdAt: Date
  description: string | null
  id: number
  inviteCode: string
  isPublic: boolean
  members: string[]
  name: string
  ownerId: number
  updatedAt: Date
}
// Reactive state
const setHasMoreMessages = ref<boolean>(true)
const serverName = ref('')
const activeSockets = ref<activeSocketsInt>({})
const socket = ref<Socket | null>(null)
const connected = ref(false)
const messages = ref<{ content: string; timestamp: Date }[]>()
const newMessage = ref('')
const userId = ref('')
const { user, token } = useAuth()
console.log('User: ', user.value?.name)
const inputRoom = ref('')
const currentchannelName = ref('')
const currentchannelId = ref<number>(0)
const userServers = ref<{ serverName: string; serverId: number }[]>([])
const channelDict = ref<Record<string, { channelName: string; channelId: number }>>({})
const loading = ref(false)
const messageContainer = ref<HTMLDivElement | null>(null)
let prevScrollPosition = 0

const formSchemaInviteCode = toTypedSchema(
  z.object({
    inviteCode: z.string().min(4).max(50),
  }),
)

const formSchemaCreateServer = toTypedSchema(
  z.object({
    serverName: z.string().min(2).max(40),
  }),
)

// eslint-disable-next-line
async function onJoinServer(values: any) {
  const joinServer = await api.post('/join-server', { user: user.value, inviteCode: values.inviteCode })
  if (joinServer.status === 200) {
    toast(`You joined server: ${joinServer.data.server.name}`, { autoClose: 5000, type: 'success', theme: 'dark' })
    displayUserServers()
  }
}

async function displayUserServers() {
  userServers.value = []
  const userServersResponse = await getUserServers(user.value!)
  console.log(userServersResponse)
  userServersResponse.forEach((server) => {
    userServers.value.push({ serverName: server.name, serverId: server.id })
    server.channels.forEach((channel) => {
      channelDict.value[server.id] = { channelName: channel.name, channelId: channel.id }
    })
  })
}
provide('displayUserServers', displayUserServers)

async function handleServerCreation(name: string, ownerId: number) {
  const response = await api.post('http://localhost:3000/create-server', { name: name, ownerId: ownerId })
  inputRoom.value = response.data.channel.name
  currentchannelId.value = response.data.channel.id
  displayUserServers()
  joinChannel(response.data.server.id)
}

// eslint-disable-next-line
const onServerCreation = (formValues: any) => {
  const serverName = formValues.serverName

  handleServerCreation(serverName, Number(user.value?.id))
}
async function getUserServers(user: User): Promise<[getUsersInt]> {
  const response = await api.post('http://localhost:3000/get-user-servers', { user })
  return response.data
}
// const getActiveSockets = async () => {
//   const response = await axios.get('http://localhost:3000/active-sockets')
//   const data = response.data
//   activeSockets.value = data
//   console.log(data)
//   return data
// }

// Connect to socket server
const connectSocket = () => {
  socket.value = io('http://localhost:3000', {
    extraHeaders: {
      authorization: `${token.value}`,
      userprofile: JSON.stringify(user.value),
    },
  })

  socket.value.on('activeSockets', (data: { activeSockets: activeSocketsInt }) => {
    // console.log('DATA: ', data.activeSockets)
    const uniqueSockets: activeSocketsInt = {}

    Object.entries(data.activeSockets).forEach(([key, socket]) => {
      // If the name is not already in uniqueSockets, add it
      if (!Object.values(uniqueSockets).some((existingSocket) => existingSocket.name === socket.name)) {
        uniqueSockets[key] = socket
      }
    })
    activeSockets.value = uniqueSockets
  })

  socket.value.on('connect_error', () => {
    router.push('/login')
    // You can check if error.message contains 'Authentication error'
  })

  // Connection established
  socket.value.on('connect', () => {
    connected.value = true
    console.log('Connected to Socket.IO server')
  })

  socket.value.on('authenticate', (data) => {
    console.log('Trying to auth ', data)
  })

  // Connection lost
  socket.value.on('disconnect', () => {
    connected.value = false
    console.log('Disconnected from Socket.IO server')
  })

  // Welcome message from server
  socket.value.on('welcome', (data: { message: string; timestamp: Date }) => {
    if (socket.value && socket.value.id) {
      userId.value = socket?.value?.id
    }
    messages.value?.push({ content: data.message, timestamp: data.timestamp })
  })

  // New user joined
  socket.value.on('newUser', (data: { message: string; timestamp: Date }) => {
    messages.value?.push({ content: data.message, timestamp: data.timestamp })
  })

  // User left
  socket.value.on('userLeft', (data) => {
    messages.value?.push({ content: data.message, timestamp: data.timestamp })
  })

  socket.value.on('recentMessages', (data: { content: string; createdAt: Date; userId: number; channelId: number; user: User }[]) => {
    messages.value = []
    data.forEach((message) => {
      messages.value?.push({ content: message.content, timestamp: message.createdAt })
      nextTick(() => {
        scrollToBottom()
      })
    })
  })

  socket.value.on('newMessage', (data: { userId: number; user: User; content: string; channelId: number; createdAt: Date }) => {
    console.log(data)
    messages.value?.push({ content: data.content, timestamp: data.createdAt })
    nextTick(() => {
      scrollToBottom()
    })
  })

  socket.value.on('gotOlderMessages', (olderMessages: Message[]) => {
    console.log('gotOlderMsg: ', olderMessages)
    const container = messageContainer.value
    if (container)
      if (olderMessages.length > 0 && socket.value && messages.value) {
        const scrollHeight = container?.scrollHeight
        const formattedOlderMessages: { content: string; timestamp: Date }[] = olderMessages.map((msg) => ({
          content: msg.content,
          timestamp: new Date(msg.createdAt), // Adapt based on your API response
        }))

        messages.value = [...formattedOlderMessages, ...messages.value]
        // Maintain scroll position after new content is added
        nextTick(() => {
          container.scrollTop = container.scrollHeight - scrollHeight
        })
      } else {
        setHasMoreMessages.value = false
      }
    loading.value = false
  })
}

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

const handleScroll = async () => {
  const container = messageContainer.value

  if (!container || loading.value || !setHasMoreMessages.value) return

  // Track if user is actively scrolling up
  const isScrollingUp = container.scrollTop < prevScrollPosition
  prevScrollPosition = container.scrollTop

  // Only load more messages if:
  // 1. User is near the top (scrollTop < 20)
  // 2. User is actively scrolling up (not just sitting at the top)
  // 3. Not already loading and more messages exist
  if (container.scrollTop < 20 && isScrollingUp && !loading.value && setHasMoreMessages.value) {
    loading.value = true

    // Load older messages
    if (messages.value && messages.value.length > 0) {
      const oldestMessage = messages.value[0]
      socket.value?.emit('loadOlderMessages', currentchannelId.value, new Date(oldestMessage.timestamp))
    }
  }
}

// Disconnect from socket server
const disconnectSocket = () => {
  if (socket.value) {
    socket.value.disconnect()
    socket.value = null
  }
}

// Send message to server
const sendMessage = (serverId: string, channelId: number, message: string) => {
  console.log('From Sendmessage ', serverId, channelId, message)
  if (newMessage.value.trim() && connected.value && socket.value) {
    socket.value.emit('sendMessage', serverId, channelId, message)
    newMessage.value = ''
  }
}

//join room
const joinChannel = (serverId: string) => {
  if (socket.value && connected.value) {
    setHasMoreMessages.value = true
    inputRoom.value = channelDict.value[serverId].channelName
    currentchannelName.value = channelDict.value[serverId].channelName
    currentchannelId.value = channelDict.value[serverId].channelId
    const serva = userServers.value.find((server) => server.serverId === Number(serverId))
    if (serva) serverName.value = serva?.serverName //
    console.log('From join channel: ', serverId, currentchannelName.value, currentchannelId.value)
    socket.value.emit('joinChannel', serverId, channelDict.value[serverId].channelId)
  }
}

// Handle scroll event

onMounted(async () => {
  displayUserServers()
  connectSocket()
})

onBeforeUnmount(() => {
  disconnectSocket()
})
</script>

<template>
  <main class="min-h-[calc(100vh-30px)] max-h-[calc(100vh-30px)] border-1 border-red-500 grid grid-rows-6 grid-cols-12">
    <!-- Servers -->
    <div class="col-span-1 row-span-6 border-2 border-blue-900">
      <DrawerWithForm :typed-schema="formSchemaInviteCode" @submit="onJoinServer" class="dark bg-background text-foreground"></DrawerWithForm>
      <DrawerWithForm
        dialog-title="Create Server"
        dialog-description="Create a new Sever"
        field-label="Server Name"
        field-name="serverName"
        field-placeholder=""
        trigger-button-text="Create Server"
        submit-button-text="Create"
        :typed-schema="formSchemaCreateServer"
        @submit="onServerCreation"
        class="dark bg-background text-foreground"
      ></DrawerWithForm>
      <div class="flex flex-row justify-center mb-1" v-for="(server, index) in userServers" :key="index">
        <Button class="text-foreground max-h-[20px] max-w-full whitespace-nowrap text-ellipsis overflow-hidden" @click="joinChannel(server.serverId.toString())">{{ server.serverName }}</Button>
      </div>
    </div>
    <!-- Messages -->
    <div ref="messageContainer" @scroll="handleScroll" class="overflow-y-auto max-h-full col-span-9 row-span-5 border-1 border-blue-500">
      <div class="pl-1" v-for="(message, index) in messages" :key="index">
        {{ message }}
      </div>
    </div>
    <!-- Users-->
    <div class="col-span-2 row-span-6 border-1 border-purple-500">
      <div v-for="(socket, index) in Object.values(activeSockets)" :key="index" class="p-2 flex flex-col">
        {{ socket.name }}
      </div>
      <p v-if="inputRoom">{{ inputRoom }}</p>
      <p v-else>Channel</p>
      <input class="border-border border-1" v-model="serverName" />
      <button @click="handleServerCreation(serverName, Number(user?.id))">createServer</button>
      <button @click="console.log(messages)">log messages</button>
    </div>
    <!-- Input -->
    <div class="col-start-2 col-span-8 border-2 border-green-700">
      <div class="h-full w-[100%] flex flex-row">
        <form class="w-[90%] border-1 border-orange-700">
          <Textarea class="w-full h-full" @keydown.enter.prevent="sendMessage(serverName, currentchannelId, newMessage)" v-model="newMessage"></Textarea>
        </form>
        <!-- button submit -->
        <div class="w-[10%] border-1 border-white">
          <button @click="sendMessage(serverName, currentchannelId, newMessage)" :disabled="!connected">Submit</button>
        </div>
      </div>
    </div>
  </main>
</template>
