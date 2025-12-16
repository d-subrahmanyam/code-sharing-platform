import './index.css'
import { Provider } from 'react-redux'
import { store } from './store'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import HomePage from './pages/HomePage'
import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

/**
 * Root App Component
 * 
 * Sets up the main application structure with:
 * - Redux store provider for state management
 * - Theme provider for light/dark mode support
 * - React Router for navigation
 * - Main application routes
 */
function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/editor/:snippetId" element={<EditorPage />} />
                <Route path="/join/:tinyCode" element={<EditorPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </Provider>
    </ThemeProvider>
  )
}

export default App
