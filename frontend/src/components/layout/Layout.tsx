import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <div className="flex flex-1" style={{ marginTop: '60px' }}>
        <Sidebar />
        <main
          className="main flex-1 overflow-y-auto"
          style={{ marginLeft: '200px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
