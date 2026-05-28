import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Header />
      <div className="flex flex-1" style={{ marginTop: '70px' }}>
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ marginLeft: '220px' }}
        >
          <div className="p-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
