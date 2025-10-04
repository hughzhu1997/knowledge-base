import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2, Server } from 'lucide-react'
import './App.css'

interface HealthStatus {
  success: boolean
  message: string
  timestamp: string
  status: string
  version: string
}

function App() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkBackendConnection = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/health')
      const data = await response.json()
      
      if (data.success) {
        setHealthStatus(data)
      } else {
        setError('Backend returned unsuccessful response')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to backend')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBackendConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <Server className="w-12 h-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">
              Knowledge Base System
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Environment Setup & Health Check
          </p>
        </div>

        {/* Status Card */}
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Backend Connection Status
            </h2>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Checking connection...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <div className="text-red-600 font-medium mb-2">Connection Failed</div>
                <div className="text-sm text-gray-600 mb-4">{error}</div>
                <button 
                  onClick={checkBackendConnection}
                  className="btn-primary"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {healthStatus && !loading && !error && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <div className="space-y-3">
                  <div>
                    <span className="status-success">Backend Connected</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Status:</strong> {healthStatus.status}</div>
                    <div><strong>Version:</strong> {healthStatus.version}</div>
                    <div><strong>Time:</strong> {new Date(healthStatus.timestamp).toLocaleString()}</div>
                  </div>
                  <button 
                    onClick={checkBackendConnection}
                    className="btn-secondary text-sm mt-4"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Development Environment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Frontend:</strong><br />
                React + V&ite + TailwindCSS
              </div>
              <div>
                <strong>Backend:</strong><br />
                Node.js + Express
              </div>
              <div>
                <strong>Database:</strong><br />
                PostgreSQL (Coming Soon)
              </div>
              <div>
                <strong>Permissions:</strong><br />
                IAM System (Coming Soon)
              </div>
 HTTP_HEADER_END 
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600">
            Ready to start development! 🚀
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
