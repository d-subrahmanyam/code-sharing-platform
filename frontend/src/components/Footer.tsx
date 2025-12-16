import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Footer Component
 * Application footer with links and information
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Code Sharing</h3>
            <p className="text-sm text-gray-400">
              Share and collaborate on code snippets in real-time with developers worldwide.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link to="/editor/new" className="text-gray-400 hover:text-white transition-colors">
                  Create Snippet
                </Link>
              </li>
              <li>
                <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-gray-400 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#careers" className="text-gray-400 hover:text-white transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              © 2025 Code Sharing Platform. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#twitter" className="text-gray-400 hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#github" className="text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
              <a href="#discord" className="text-gray-400 hover:text-white transition-colors">
                Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
