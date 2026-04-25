import { useNavigate } from 'react-router'

export function WaiterViewDebug() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-blue-500 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Debug Mode</h1>
        <p className="mb-4">If you can see this, routing works</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-white text-blue-500 rounded">
          Back to Login
        </button>
      </div>
    </div>
  )
}
