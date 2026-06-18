//src/app/App.tsx
import { RouterProvider } from 'react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { router } from './routes'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1046164044908-kij7glj1kdkinojil7hau8q3etoevf2i.apps.googleusercontent.com'

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  )
}
