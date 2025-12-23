import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: [
      'admin.paribrand.love', // Specific domain
      '.paribrand.love', // Allows the domain and all subdomains (e.g., www.subdomain-wildcard.com)
      //'192.168.1.100' // Specific IP address
    ],
  }
})
