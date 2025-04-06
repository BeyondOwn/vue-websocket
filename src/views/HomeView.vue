<script setup lang="ts">
import DrawerWithForm from '@/components/DrawerWithForm.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import NormalDialogue from '@/components/NormalDialogue.vue'
import ShareDialogue from '@/components/ShareDialogue.vue'
import DropdownMenu from '@/components/ui/dropdown-menu/DropdownMenu.vue'
import DropdownMenuContent from '@/components/ui/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuItem from '@/components/ui/dropdown-menu/DropdownMenuItem.vue'
import DropdownMenuLabel from '@/components/ui/dropdown-menu/DropdownMenuLabel.vue'
import DropdownMenuSeparator from '@/components/ui/dropdown-menu/DropdownMenuSeparator.vue'
import DropdownMenuTrigger from '@/components/ui/dropdown-menu/DropdownMenuTrigger.vue'
import Textarea from '@/components/ui/textarea/Textarea.vue'
import UploadThing from '@/components/UploadThing.vue'
import { useAuth } from '@/lib/authContext'
import api, { BACKEND } from '@/lib/axios'
import { useTheme } from '@/lib/UseTheme'
import type { UrlData, User } from '@/models/models'
import router from '@/router'
import { toTypedSchema } from '@vee-validate/zod'
import { Ellipsis, PencilLine, Trash2Icon } from 'lucide-vue-next'
import { io, Socket } from 'socket.io-client'
import { computed, isRef, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { toast, type ToastTheme } from 'vue3-toastify'
import { z } from 'zod'
import Button from '../components/ui/button/Button.vue'

interface activeSocketsInt {
  [socketId: string]: User
}

interface activeSocketsChannelInt {
  [socketId: string]: User[]
}

interface Message {
  id: string
  type?: string
  content: string
  links?: UrlData[]
  createdAt: Date
  userId: number
  channelId?: number
  user?: User
  edited: boolean
  editedAt: Date | null
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
const showSidebarLeft = ref(false)
const showSidebarRight = ref(false)
const setHasMoreMessages = ref<boolean>(true)
const serverName = ref('')
const activeSockets = ref<activeSocketsInt>({})
const activeSocketsChannel = ref<activeSocketsChannelInt>({})
const socket = ref<Socket | null>(null)
const connected = ref(false)
const messages = ref<Message[]>()
const newMessage = ref('')
const userId = ref('')
const { user, token, logout } = useAuth()
console.log('User: ', user.value)
const inputRoom = ref('')
const currentchannelName = ref('')
const currentchannelId = ref<number>(0)
const userServers = ref<{ serverName: string; serverId: number }[]>([])
const channelDict = ref<Record<string, { channelName: string; channelId: number }>>({})
const loading = ref(false)
const messageContainer = ref<HTMLDivElement | null>(null)
const currentServerId = ref<string>()
const userServersResponse = ref<getUsersInt[]>()
let prevScrollPosition = 0
const close = ref(false)
const inviteCodeRef = ref('')
const currentServerOwner = ref('')
const ImagePreviewRef = ref<File[]>([])
const showPreview = ref<boolean>(false)
const isHovered = ref<boolean[]>([])
const isMenuOpen = ref<boolean[]>([])
const editor = ref<boolean[]>([])
const editorText = ref<string>('')
const editorSubmit = ref<boolean>(false)
const startUpload = ref<boolean>(false)
const imagesUploaded = ref<boolean>(false)
const imagesLoading = ref(false)

const isActive = computed(() => {
  return (index: number) => {
    return isHovered.value[index] || isMenuOpen.value[index]
  }
})

const handleDeleteMessage = async (userId: number, messageId: string, channelId: number) => {
  socket.value?.emit('delete-message', { userId, messageId, channelId })
}

const handleEditMessage = async (userId: number, messageId: string, channelId: number, newContent: string, index: number, oldValue: string) => {
  editorText.value = oldValue
  editor.value[index] = true
  console.log('From HandleEdit: ', editor.value, editorSubmit.value, editorText.value)
  if (editorSubmit.value && editorText.value) {
    socket.value?.emit('edit-message', { userId, messageId, channelId, newContent })
    editorSubmit.value = false
    editor.value[index] = false
  }
}

const handleMouseLeave = (index: number) => {
  // Only remove hover state if menu is closed
  // console.log('isMenuOpen: ', isMenuOpen.value[index])
  if (!isMenuOpen[index]) {
    isHovered.value[index] = false
  }
  // console.log('isHovered: ', isHovered[index])
}

const { theme } = useTheme()
console.log('Is it reactive: ', isRef(theme))

watch(
  theme,
  (newTheme) => {
    console.log('Force-tracked: ', newTheme)
  },
  { deep: true },
)

// Function to wait for images within a specific element
async function waitForImages(element: HTMLElement): Promise<void> {
  const images: NodeListOf<HTMLImageElement> = element.querySelectorAll('img')
  const promises: Promise<void>[] = []

  images.forEach((img) => {
    // Check if the image isn't already loaded or broken
    if (!img.complete) {
      promises.push(
        new Promise((resolve) => {
          img.onload = () => resolve()
          img.onerror = () => {
            console.warn(`Image failed to load: ${img.src}`)
            resolve() // Resolve even on error so scrolling happens
          }
          img.onabort = () => {
            // Handle aborts as well
            console.warn(`Image load aborted: ${img.src}`)
            resolve()
          }
        }),
      )
    } else if (img.naturalWidth === 0 && img.src) {
      // It's 'complete' but failed to load (naturalWidth is 0)
      console.warn(`Image already failed (complete but naturalWidth 0): ${img.src}`)
    }
  })

  if (promises.length > 0) {
    console.log(`Waiting for ${promises.length} image(s) in new message...`)
    await Promise.allSettled(promises)
    console.log('Images settled.')
  } else {
    console.log('No pending images found in the new message.')
  }
}

// --- Watcher ---
// Watch the messages array for changes (specifically additions)
watch(
  // Use props.messages if messages is a prop, else local ref messages.value
  () => messages.value, // Watch the value of the ref directly
  async (newMessages, oldMessages) => {
    const oldLength = oldMessages?.length ?? 0
    const newLength = newMessages?.length

    // Trigger only when a message is added, and the container exists
    if (newLength! > oldLength && messageContainer.value) {
      console.log('New message detected.')
      // Wait for Vue to render the new message element
      await nextTick()

      const container = messageContainer.value
      const allMessageItems = Array.from(container!.querySelectorAll('.message-item'))

      // Find the last one with img.with-picture
      const lastMessageElement = allMessageItems.reverse().find((item) => item.querySelector('img.with-picture')) as HTMLElement

      // console.log('LastImg: ', lastMessageElement)
      if (lastMessageElement) {
        // Wait for images within that *specific* last element to load/settle
        await waitForImages(lastMessageElement)
        // Scroll smoothly after images are ready
        scrollToBottom()
        console.log('SCROLLED')
      } else {
        console.warn('Could not find the last message element. Scrolling container anyway.')
        // Fallback if the element isn't found immediately (shouldn't happen often)
        scrollToBottom()
      }
    }
    // Optional: Handle initial load scrolling
    // if (newLength > 0 && oldLength === 0) {
    //    scrollToBottom('auto'); // Instant scroll on initial load
    // }
  },
  { deep: false }, // Only react to array changes (add/remove), not object content changes unless needed
)

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

const isModalOpen = ref(false)

const openUploadModal = () => {
  isModalOpen.value = true
}

const closeUploadModal = () => {
  isModalOpen.value = false
}

const handleDeletePreview = (index: number) => {
  ImagePreviewRef.value.splice(index, 1)
  if (ImagePreviewRef.value.length == 0) {
    showPreview.value = false
  }
}

const handleDeletePreviewAll = () => {
  ImagePreviewRef.value = []
  showPreview.value = false
}

const handleFileReady = (file) => {
  console.log('From handleFileReady: ', file)
  ImagePreviewRef.value = file
  showPreview.value = true
  imagesUploaded.value = false
}

const handleUploadComplete = (result) => {
  console.log('File uploaded successfully:', result)
  result.forEach((element) => {
    console.log('Each element: ', element)
    newMessage.value = `${newMessage.value} ${element.ufsUrl}`
  })
  imagesLoading.value = false
  imagesUploaded.value = true
  toast('File uploaded successfully', { autoClose: 5000, type: 'success', theme: theme.value as ToastTheme, position: 'bottom-right' })
  ImagePreviewRef.value = []
  showPreview.value = false
}

// eslint-disable-next-line
const handleUploadError = (error: any) => {
  console.error('Upload failed:', error)
  alert('Upload failed: ' + error.message)
}

function formatMessageWithLinks(message: Message) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const imgRegex = /(https?:\/\/.*\.(png|jpe?g|gif|webp|bmp|tiff?))/g

  let formattedContent = message.content

  formattedContent = formattedContent.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 underline">${url}</a>`
  })

  formattedContent = formattedContent.replace(imgRegex, (img) => {
    return `<img src='${img}' class="with-picture max-w-full  object-contain" />`
  })

  if (message.links && message.links.length > 0) {
    message.links.forEach((link) => {
      if (link.isImage) {
        // Replace image links based on the link metadata
        formattedContent = formattedContent.replace(`<a href="${link.link}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 underline">${link.link}</a>`, `<img src="${link.link}"class="with-picture max-w-full object-contain " />`)
      } else {
        formattedContent = formattedContent.replace(`<a href="${link.link}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 underline">${link.link}</a>`, `<a href="${link.link}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 underline ">${link.link}</a>`)
      }
    })
  }

  return formattedContent
}

// eslint-disable-next-line
async function onJoinServer(values: any) {
  const joinServer = await api.post('/join-server', { user: user.value, inviteCode: values.inviteCode })
  if (joinServer.status === 200) {
    toast(`You joined server: ${joinServer.data.server.name}`, { autoClose: 5000, type: 'success', position: 'bottom-right', theme: theme.value as ToastTheme })
    displayUserServers()
  }
}

async function onLeaveServer(user: User, serverId: string) {
  const leaveServer = await api.post('/leave-server', { user: user, serverId: serverId })
  if (leaveServer.status === 200) {
    close.value = true
    toast(`You left server: ${leaveServer.data.name}`, { autoClose: 5000, type: 'success', position: 'bottom-right', theme: theme.value as ToastTheme })
    displayUserServers()
  }
}

async function displayUserServers() {
  userServers.value = []
  userServersResponse.value = await getUserServers(user.value!)
  console.log('User Servers: ', userServersResponse)
  userServersResponse.value.forEach((server) => {
    userServers.value.push({ serverName: server.name, serverId: server.id })
    server.channels.forEach((channel) => {
      channelDict.value[server.id] = { channelName: channel.name, channelId: channel.id }
    })
  })
  console.log('User Servers: ', userServers)
}
provide('displayUserServers', displayUserServers)

async function handleServerCreation(name: string, ownerId: number) {
  const response = await api.post('/create-server', { name: name, ownerId: ownerId })
  inputRoom.value = response.data.channel.name
  currentchannelId.value = response.data.channel.id
  toast(`You created server: ${response.data.server.name}`, { autoClose: 5000, type: 'success', position: 'bottom-right', theme: theme.value as ToastTheme })
  displayUserServers()
  joinChannel(response.data.server.id)
}

// eslint-disable-next-line
const onServerCreation = (formValues: any) => {
  const serverName = formValues.serverName

  handleServerCreation(serverName, Number(user.value?.id))
}
async function getUserServers(user: User): Promise<[getUsersInt]> {
  const response = await api.post('/get-user-servers', { user })
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
  socket.value = io(`${BACKEND}`, {
    extraHeaders: {
      authorization: `${token.value}`,
      userprofile: JSON.stringify(user.value),
    },
  })

  socket.value.on('activeSockets', (data: { activeSockets: activeSocketsInt }) => {
    console.log('DATA: ', data.activeSockets)
    const uniqueSockets: activeSocketsInt = {}

    Object.entries(data.activeSockets).forEach(([key, socket]) => {
      // If the name is not already in uniqueSockets, add it
      if (!Object.values(uniqueSockets).some((existingSocket) => existingSocket.name === socket.name)) {
        uniqueSockets[key] = socket
      }
    })
    activeSockets.value = uniqueSockets
  })

  socket.value.on('activeSocketsChannel', (data: { activeSocketsChannel: activeSocketsChannelInt }) => {
    console.log('DATA: ', data.activeSocketsChannel)

    activeSocketsChannel.value = data.activeSocketsChannel
    console.log('current chan:', currentchannelId)
    console.log('From activeChannels: ', activeSocketsChannel.value)
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

  socket.value.on('error', (data: { message: string }) => {
    console.log(data.message)
    toast(`${data.message}`, { autoClose: 5000, type: 'error', position: 'bottom-right', theme: theme.value as ToastTheme })
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
  socket.value.on('welcome', (data: { id: string; message: string; timestamp: Date }) => {
    if (socket.value && socket.value.id) {
      userId.value = socket?.value?.id
    }
    if (user.value) messages.value?.push({ edited: false, editedAt: null, id: data.id, content: data.message, createdAt: data.timestamp, userId: Number(user.value?.id) })
  })

  // New user joined
  socket.value.on('newUser', (data: { id: string; message: string; timestamp: Date; type: string }) => {
    if (user.value) messages.value?.push({ edited: false, editedAt: null, id: data.id, content: data.message, createdAt: data.timestamp, userId: Number(user.value.id), type: data.type })
    console.log('newUser: ', messages.value)
  })

  // User left
  socket.value.on('userLeft', (data) => {
    if (user.value) messages.value?.push({ edited: false, editedAt: null, id: data.id, content: data.message, createdAt: data.timestamp, userId: Number(user.value.id), type: data.type })
  })

  socket.value.on('recentMessages', (data: Message[]) => {
    // Clear messages only if the data is not empty
    if (data && data.length > 0) {
      messages.value = data.map((message) => ({
        id: message.id,
        content: message.content,
        links: message.links,
        createdAt: message.createdAt,
        userId: message.userId,
        user: message.user,
        edited: message.edited,
        editedAt: message.editedAt,
      }))

      nextTick(() => {
        scrollToBottom()
      })
    }
    loading.value = false
    // just load initial messages
    console.log('Recent mess: ', messages)
    LoadInitialMessages()
  })

  socket.value.on('newMessage', (data: { edited: boolean; editedAt: Date | null; id: string; links?: UrlData[]; userId: number; user: User; content: string; channelId: number; createdAt: Date }) => {
    console.log(data)
    messages.value?.push({ edited: data.edited, editedAt: data.editedAt, id: data.id, links: data.links, content: data.content, createdAt: data.createdAt, userId: data.userId, user: data.user })
    nextTick(() => {
      scrollToBottom()
    })
  })

  socket.value.on('deletedMessage', (messageId: string) => {
    // console.log('Tried to..', messageId)
    messages.value = messages.value?.filter((message) => {
      return message.id !== messageId
    })
    toast(`Deleted Message!`, { autoClose: 3000, type: 'success', theme: theme.value as ToastTheme })
  })

  socket.value.on('editedMessage', (messageId: string, newContent: string) => {
    console.log('Tried to edit..', messageId)
    messages.value?.forEach((message, index) => {
      if (message.id == messageId) {
        messages.value![index].content = newContent
      }
    })
    toast(`Edited Message!`, { autoClose: 3000, type: 'success', theme: theme.value as ToastTheme })
    console.log(messages.value)
  })

  socket.value.on('gotOlderMessages', (olderMessages: Message[]) => {
    console.log('gotOlderMsg: ', olderMessages)
    const container = messageContainer.value
    if (container)
      if (olderMessages.length > 0 && socket.value && messages.value) {
        const scrollHeight = container?.scrollHeight
        // const formattedOlderMessages: { content: string; timestamp: Date }[] = olderMessages.map((msg) => ({
        //   content: msg.content,
        //   createdAt: new Date(msg.createdAt),
        //   userId:msg.userId // Adapt based on your API response
        // }))

        messages.value = [...olderMessages, ...messages.value]
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

  if (!container || loading.value || !setHasMoreMessages.value || close.value == true) return

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
      socket.value?.emit('loadOlderMessages', currentchannelId.value, new Date(oldestMessage.createdAt))
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
  if (ImagePreviewRef.value.length > 0 && !imagesUploaded.value) startUpload.value = true
  // console.log('still sendmessage: ', imagesUploaded.value, startUpload.value)
  if (ImagePreviewRef.value.length > 0) {
    if (newMessage.value.trim() && connected.value && socket.value && imagesUploaded.value) {
      socket.value.emit('sendMessage', serverId, channelId, message)
      newMessage.value = ''
      startUpload.value = false
    }
  } else {
    if (newMessage.value.trim() && connected.value && socket.value) {
      socket.value.emit('sendMessage', serverId, channelId, message)
      newMessage.value = ''
      startUpload.value = false
    }
  }
}

//join room
const joinChannel = (serverId: string) => {
  if (socket.value && connected.value) {
    messages.value = []
    close.value = false
    console.log(close.value)
    setHasMoreMessages.value = true
    inputRoom.value = channelDict.value[serverId].channelName
    currentchannelName.value = channelDict.value[serverId].channelName
    currentchannelId.value = channelDict.value[serverId].channelId
    currentServerId.value = serverId
    const currentServer = userServersResponse.value?.filter((server) => server.id == Number(serverId))
    if (currentServer) {
      console.log('Currentserver[0].ownerid: ', currentServer)
      currentServerOwner.value = currentServer[0].ownerId.toString()
    }
    console.log('servw Owana: ', currentServerOwner.value)
    const serva = userServers.value.find((server) => server.serverId === Number(serverId))
    if (serva) serverName.value = serva?.serverName //
    console.log('From join channel: ', serverId, currentchannelName.value, currentchannelId.value)
    socket.value.emit('joinChannel', serverId, channelDict.value[serverId].channelId)
    ShareInviteCode()
  }
}

const ShareInviteCode = async () => {
  if (userServersResponse.value && currentServerId.value) {
    const myServer = userServersResponse.value?.filter((server) => {
      return server.id == Number(currentServerId.value)
    }) // console.log('Invite Code ', myServer[0].inviteCode)
    inviteCodeRef.value = myServer[0].inviteCode
    provide(
      'inviteCode',
      computed(() => inviteCodeRef.value),
    )
    console.log('PROVIDE ', inviteCodeRef.value)
  }
}

const toggleSidebarLeft = () => {
  if (showSidebarRight.value == true) showSidebarRight.value = false
  showSidebarLeft.value = !showSidebarLeft.value
}

const toggleSidebarRight = () => {
  if (showSidebarLeft.value == true) showSidebarLeft.value = false
  showSidebarRight.value = !showSidebarRight.value
}

const LoadInitialMessages = async () => {
  const container = messageContainer.value

  if (!container || close.value == true) return
  // Check if the container is not scrollable
  const isNotScrollable = container.scrollHeight <= container.clientHeight

  console.log('handle scroll: ', isNotScrollable, loading.value, setHasMoreMessages.value)

  // If not scrollable and we haven't loaded initial older messages, load them
  if (isNotScrollable && !loading.value && setHasMoreMessages.value) {
    loading.value = true
    console.log('BRR', messages.value)
    // Load older messages
    if (messages.value) {
      console.log('HERE')
      const oldestMessage = messages.value[0]
      socket.value?.emit('loadOlderMessages', currentchannelId.value, new Date(oldestMessage.createdAt))
      loading.value = false
    }
    return
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
  <main class="font-poppins min-h-[calc(100vh-40px)] max-h-[calc(100vh-40px)] w-[100vw] grid grid-cols-12 bg-background text-foreground">
    <!-- Sidebar with Server List -->
    <div :class="[`${showSidebarRight ? 'hidden' : ''}`, `${showSidebarLeft ? '' : 'hidden'}`, 'col-span-4 md:block md:col-span-2 max-w-full max-h-full row-span-full border-r border-border bg-muted/30']">
      <div class="flex h-16 items-center p-4 border-b border-border">
        <h2 class="text-lg font-poppins font-semibold">Server List</h2>
      </div>

      <div class="p-2 max-h-full max-w-full gap-1 flex flex-col items-start">
        <DrawerWithForm :typed-schema="formSchemaInviteCode" @submit="onJoinServer" class-trigger="h-[40px] w-full max-w-full truncate text-secondary" class="mb-2 text-foreground"></DrawerWithForm>

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
          class="mb-4 text-foreground"
          class-trigger="h-[40px] w-full max-w-full truncate text-secondary"
        ></DrawerWithForm>

        <div class="space-y-1 max-h-full w-full max-w-full">
          <Button v-for="(server, index) in userServers" :key="index" variant="ghost" class="w-full justify-start pl-2 text-left" @click="joinChannel(server.serverId.toString())">
            <div class="flex items-center w-full max-w-full">
              <div class="h-8 w-8 rounded-full bg-primary/20 mr-3 flex items-center justify-center text-xs">
                {{ server.serverName.charAt(0) }}
              </div>
              <span class="truncate w-full max-w-full">{{ server.serverName }}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div :class="[`${showSidebarRight ? 'col-span-8' : ''}`, `${showSidebarLeft ? 'col-span-8' : ''}`, 'col-span-12 md:col-span-8 max-w-full  max-h-[calc(100vh-40px)] row-span-full flex flex-col']">
      <!-- Header -->
      <div class="flex flex-row flex-wrap max-w-full max-h-full md:h-16 items-center justify-end md:justify-between p-4 border-b border-border">
        <div class="flex items-center md:w-[20%] w-full">
          <h2 class="text-lg font-poppins font-semibold truncate w-full">{{ serverName ? serverName : 'Server Name' }}</h2>
        </div>

        <div class="flex flex-row flex-wrap max-w-full max-h-full items-center space-x-2">
          <ShareDialogue :disabled="[currentServerId == undefined, close]" trigger-button-text="Invite Code" class="text-foreground" dialog-description="Anyone with this Invite Code can join the server." dialog-title="Share Invite Code" :link="inviteCodeRef"></ShareDialogue>
          <NormalDialogue :disabled="[currentServerId == undefined, close]" :fnc="() => onLeaveServer(user!, currentServerId!)" trigger-button-text="Leave" dialog-description=" " dialog-title="Are you sure you want to leave the server?" button1text="Close" button2text="Leave" button2class="justify-self-end bg-red-500 hover:bg-red-600" />

          <Button
            class="font-poppins"
            @click="
              () => {
                close = true
                console.log(close)
              }
            "
            variant="outline"
            size="sm"
          >
            Close
          </Button>
        </div>
        <!-- arrows -->
        <div class="flex flex-row justify-between w-full">
          <Button @click="toggleSidebarLeft" class="md:hidden mr-2 z-50" variant="outline"
            ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-left-icon lucide-chevrons-left">
              <path d="m11 17-5-5 5-5" />
              <path d="m18 17-5-5 5-5" />
            </svg>
          </Button>
          <Button @click="toggleSidebarRight" class="md:hidden mr-2 z-50" variant="outline">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevrons-right-icon lucide-chevrons-right">
              <path d="m6 17 5-5-5-5" />
              <path d="m13 17 5-5-5-5" />
            </svg>
          </Button>
        </div>
      </div>

      <!-- Messages -->
      <div ref="messageContainer" @scroll="handleScroll" class="flex-1 max-h-[calc(100vh-120px)] overflow-y-scroll px-4 py-2 space-y-4">
        <div v-for="(message, index) in messages" :key="index" class="message-item flex flex-col font-poppins">
          <div v-if="message.user?.id === user?.id && close == false" class="flex justify-start items-start mb-4">
            <div class="mr-4 flex-shrink-0">
              <div v-if="!message.user?.picture" class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                {{ message.user?.name?.charAt(0) || 'U' }}
              </div>
              <img v-else class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs" :src="message.user.picture" />
            </div>
            <div
              :class="`flex-1 flex-col rounded-md relative ${isActive(index) ? 'bg-card' : ''}`"
              :onmouseenter="
                () => {
                  isHovered[index] = true
                }
              "
              :onmouseleave="() => handleMouseLeave(index)"
            >
              <div v-if="message.type != 'system'" class="absolute top-0 right-0" :onmouseenter="() => (isHovered[index] = true)">
                <DropdownMenu v-model:open="isMenuOpen[index]">
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" :class="[`${!isActive(index) ? 'opacity-0' : 'opacity-100'}`, 'hover:bg-card']">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel> Options </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Button @click="handleDeleteMessage(Number(user?.id!), message.id, currentchannelId)" variant="ghost" class="p-0 flex items-center justify-between w-full text-red-500 group">
                        <span class="text-red-500">Delete</span>
                        <Trash2Icon class="text-red-500"></Trash2Icon>
                      </Button>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Button @click="handleEditMessage(Number(user?.id!), message.id, currentchannelId, editorText, index, message.content)" variant="ghost" class="p-0 flex items-center justify-between w-full group">
                        <span class="">Edit</span>
                        <PencilLine class=""></PencilLine>
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div class="text-base text-blue-500 font-bold truncate max-w-[80%]">
                {{ message.user?.name }}
              </div>
              <div v-if="editor[index]" class="p-3 rounded-lg bg-card text-sm w-full">
                <Textarea class="flex-1 rounded-md min-h-[40px] w-full resize-none bg-background" v-model="editorText"> </Textarea>
                <div class="mt-2 space-x-2 flex flex-row">
                  <Button
                    @click="
                      () => {
                        editorSubmit = true
                        handleEditMessage(Number(user?.id!), message.id, currentchannelId, editorText, index, message.content)
                      }
                    "
                    >Edit</Button
                  >
                  <Button
                    @click="
                      () => {
                        editor[index] = false
                      }
                    "
                    >Cancel</Button
                  >
                </div>
              </div>
              <div v-else-if="message.links" class="p-3 rounded-lg text-sm w-full">
                <span v-html="formatMessageWithLinks(message)"></span>
              </div>

              <div v-else class="p-3 rounded-lg bg-card text-sm w-full">
                {{ message.content }}
              </div>

              <div class="text-xs text-muted-foreground mt-1">
                {{ new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
          </div>
          <div v-else-if="message.user?.id !== user?.id && close == false" class="flex items-start mb-4">
            <div class="mr-4 flex-shrink-0">
              <div v-if="!message.user?.picture" class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                {{ message.user?.name?.charAt(0) || 'U' }}
              </div>
              <img v-else class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs" :src="message.user.picture" />
            </div>
            <div
              :class="`flex-1 flex-col rounded-md relative ${isActive(index) ? 'bg-card' : ''}`"
              :onmouseenter="
                () => {
                  isHovered[index] = true
                }
              "
              :onmouseleave="() => handleMouseLeave(index)"
            >
              <div v-if="message.type != 'system'" class="absolute top-0 right-0" :onmouseenter="() => (isHovered[index] = true)">
                <DropdownMenu v-model:open="isMenuOpen[index]">
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" :class="[`${!isActive(index) ? 'opacity-0' : 'opacity-100'}`, 'hover:bg-card']">
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel> Options </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Button @click="handleDeleteMessage(Number(user?.id!), message.id, currentchannelId)" variant="ghost" class="p-0 flex items-center justify-between w-full text-red-500 group">
                        <span class="group-hover:text-red-600">Delete</span>
                        <Trash2Icon class="text-red-500 group-hover:text-red-600"></Trash2Icon>
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div class="text-base font-bold">
                {{ message.user?.name }}
              </div>
              <div v-if="message.links" class="p-3 rounded-lg text-sm max-w-[80%]">
                <span v-html="formatMessageWithLinks(message)"></span>
              </div>
              <div v-else class="p-3 rounded-lg text-sm max-w-[80%]">
                {{ message.content }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                {{ new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="flex flex-col justify-center p-4 border-t border-border bg-muted/30">
        <ImagePreview :images-loading="imagesLoading" :delete="handleDeletePreview" :show="showPreview" :img="ImagePreviewRef!" />
        <div class="flex items-center">
          <!--Upload image-->
          <Button @click="openUploadModal" class="mr-2 text-foreground" variant="default">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-icon lucide-image text-secondary !w-6 !h-6">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </Button>
          <UploadThing
            @uploading="
              () => {
                imagesLoading = true
                console.log(imagesLoading)
              }
            "
            :startUpload="startUpload"
            @file-clear="handleDeletePreviewAll"
            :show="isModalOpen"
            endpoint="imageUploader"
            @file-ready="handleFileReady"
            @close="closeUploadModal"
            @uploadComplete="handleUploadComplete"
            @uploadError="handleUploadError"
          />
          <Textarea class="flex-1 rounded-md min-h-[40px] resize-none bg-background" placeholder="Type your message..." v-model="newMessage" @keydown.enter.prevent="sendMessage(currentServerId!, currentchannelId, newMessage)"> </Textarea>
          <Button class="ml-2 text-secondary" @click="sendMessage(currentServerId!, currentchannelId, newMessage)" :disabled="!connected"> Send </Button>
        </div>
      </div>
    </div>

    <!--Sidemenu to display active users-->
    <div :class="[`${showSidebarRight ? '' : 'hidden'}`, `${showSidebarLeft ? 'hidden' : ''}`, 'col-span-4  md:block md:col-span-2 overflow-hidden w-full max-w-full max-h-full row-span-full border-l border-border bg-muted/30']">
      <div class="flex h-16 items-center p-4 border-b border-border">
        <h2 class="text-lg font-poppins font-semibold">Active users</h2>
      </div>

      <!-- iterate users-->
      <div class="flex flex-col md:items-baseline items-center m-2" v-for="(user, index) in activeSocketsChannel[currentchannelId]" :key="index">
        <div v-if="!close" class="flex flex-col md:flex-row items-center max-w-full md:space-x-3">
          <img class="h-8 w-8 rounded-full bg-primary/20 flex-shrink-0" :src="user.picture" :alt="user.name" />
          <span class="truncate w-full">{{ user.name }}</span>
          <svg v-if="currentServerOwner == user.id" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-crown-icon lucide-crown text-yellow-500 flex-shrink-0">
            <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
            <path d="M5 21h14" />
          </svg>
        </div>
      </div>
    </div>
  </main>
</template>
