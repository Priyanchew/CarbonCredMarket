import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Leaf, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const PublicHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CarbonCredit</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link to="/api-docs" className="text-gray-600 hover:text-gray-900 transition-colors">
              API Docs
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/app/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
            )}
            <Link
              to="/get-started"
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/about"
                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={toggleMenu}
              >
                About
              </Link>
              <Link
                to="/pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={toggleMenu}
              >
                Pricing
              </Link>
              <Link
                to="/api-docs"
                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={toggleMenu}
              >
                API Docs
              </Link>
              <Link
                to="/contact"
                className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                onClick={toggleMenu}
              >
                Contact
              </Link>
              <hr className="border-gray-200" />
              {isAuthenticated ? (
                <Link
                  to="/app/dashboard"
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={toggleMenu}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors py-2"
                  onClick={toggleMenu}
                >
                  Sign In
                </Link>
              )}
              <Link
                to="/get-started"
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                onClick={toggleMenu}
              >
                Get Started
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
