<script setup lang="ts">
import { useAuth } from '@/lib/authContext'
import ToggleTheme from './ToggleTheme.vue'
import Button from './ui/button/Button.vue'
import DropdownMenu from './ui/dropdown-menu/DropdownMenu.vue'
import DropdownMenuContent from './ui/dropdown-menu/DropdownMenuContent.vue'
import DropdownMenuItem from './ui/dropdown-menu/DropdownMenuItem.vue'
import DropdownMenuLabel from './ui/dropdown-menu/DropdownMenuLabel.vue'
import DropdownMenuSeparator from './ui/dropdown-menu/DropdownMenuSeparator.vue'
import DropdownMenuTrigger from './ui/dropdown-menu/DropdownMenuTrigger.vue'
const { user, logout } = useAuth()
</script>
<template>
  <nav class="wrapper h-10 border border-border grid grid-cols-12 font-poppins font-bold bg-background text-foreground">
    <div class="col-span-4 md:col-span-2 flex items-center">
      <span class="pl-4">Chat App</span>
    </div>
    <div class="col-span-4 md:col-span-8 flex justify-center">
      <RouterLink to="/">
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="40" height="40" viewBox="0 0 48 48">
          <linearGradient id="3gvvizWQ9RZhriH82V06da_zKtqfACOebXo_gr1" x1="30.574" x2="17.439" y1="3.695" y2="45.444" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#33bef0"></stop>
            <stop offset="1" stop-color="#0a85d9"></stop>
          </linearGradient>
          <path fill="url(#3gvvizWQ9RZhriH82V06da_zKtqfACOebXo_gr1)" d="M24.5,5C13.73,5,5,13.059,5,23c0,5.386,2.566,10.215,6.627,13.514	c0.233,0.19,0.373,0.47,0.373,0.77v5.098c0,0.743,0.782,1.227,1.447,0.894l5.555-2.777c0.208-0.104,0.443-0.129,0.669-0.075	C21.217,40.79,22.83,41,24.5,41C35.27,41,44,32.941,44,23C44,13.059,35.27,5,24.5,5z"></path>
          <path
            d="M36.721,19.262c-0.162-0.369-0.521-0.607-0.913-0.607c-0.156,0-0.308,0.037-0.453,0.109l-6.933,3.467	c-0.192,0.096-0.425,0.059-0.577-0.094l-4.12-4.12c-0.189-0.189-0.44-0.293-0.707-0.293c-0.281,0-0.551,0.119-0.74,0.327	l-7.601,8.362c-0.271,0.298-0.339,0.708-0.179,1.07c0.163,0.369,0.522,0.607,0.914,0.607c0.17,0,0.335-0.044,0.491-0.13l5.618-3.121	c0.21-0.117,0.473-0.068,0.627,0.117l4.104,4.925c0.191,0.229,0.471,0.36,0.768,0.36c0.279,0,0.548-0.118,0.737-0.324l8.784-9.582	C36.811,20.037,36.881,19.626,36.721,19.262z"
            opacity=".07"
          ></path>
          <path fill="#fff" fill-rule="evenodd" d="M15.046,26.75l7.601-8.362c0.192-0.211,0.522-0.219,0.724-0.017	l4.374,4.374c0.152,0.152,0.385,0.19,0.577,0.094l7.256-3.628c0.496-0.248,0.967,0.376,0.592,0.785l-8.784,9.582	c-0.205,0.223-0.559,0.215-0.753-0.018l-4.369-5.243c-0.154-0.185-0.417-0.234-0.627-0.117l-5.979,3.322	C15.164,27.798,14.665,27.168,15.046,26.75z" clip-rule="evenodd"></path>
          <path
            d="M23.017,17.724c0.267,0,0.518,0.104,0.707,0.293l4.12,4.12c0.152,0.152,0.385,0.19,0.577,0.094 l6.933-3.467c0.145-0.073,0.298-0.109,0.453-0.109c0.392,0,0.751,0.238,0.913,0.607c0.16,0.364,0.091,0.775-0.182,1.072 l-8.784,9.582c-0.189,0.206-0.458,0.324-0.737,0.324c-0.298,0-0.578-0.131-0.768-0.36l-4.104-4.925 c-0.154-0.185-0.417-0.234-0.627-0.117l-5.618,3.121c-0.156,0.086-0.321,0.13-0.491,0.13c-0.392,0-0.751-0.238-0.914-0.607 c-0.16-0.362-0.092-0.773,0.179-1.07l7.601-8.362C22.466,17.844,22.736,17.724,23.017,17.724 M23.017,17.224 c-0.422,0-0.826,0.179-1.11,0.491l-7.601,8.362c-0.406,0.446-0.508,1.063-0.266,1.609c0.243,0.549,0.781,0.904,1.371,0.904 c0.256,0,0.503-0.065,0.734-0.193l5.256-2.92c0.21-0.117,0.473-0.068,0.627,0.117l3.839,4.606c0.286,0.343,0.706,0.54,1.152,0.54 c0.419,0,0.822-0.177,1.106-0.486l8.784-9.582c0.408-0.446,0.512-1.063,0.271-1.611c-0.242-0.55-0.78-0.906-1.371-0.906 c-0.234,0-0.462,0.055-0.677,0.162l-6.611,3.306c-0.192,0.096-0.425,0.059-0.577-0.094l-3.865-3.865 C23.794,17.38,23.418,17.224,23.017,17.224L23.017,17.224z"
            opacity=".05"
          ></path>
        </svg>
      </RouterLink>
    </div>
    <!-- Navigation Links -->
    <div class="col-span-4 md:col-span-2 flex justify-end md:justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button class="hover:bg-accent" variant="ghost">
            <img class="rounded-4xl" width="32" height="32" :src="user?.picture" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <RouterLink class="w-full" to="/">Home</RouterLink>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <RouterLink class="w-full" to="/profile">Profile</RouterLink>
          </DropdownMenuItem>
          <DropdownMenuItem @select="(event) => event.preventDefault()">
            <ToggleTheme />
          </DropdownMenuItem>

          <DropdownMenuItem @click="logout">
            Logout
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out-icon lucide-log-out text-foreground">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </nav>
</template>
