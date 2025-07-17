import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Bell, Rocket } from 'lucide-react';

const ComingSoonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            to="/landing" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-12 border-0">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 rounded-full">
              <Rocket className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            We're working hard to bring you this exciting new feature. 
            Stay tuned for updates!
          </p>

          {/* Features Preview */}
          <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-full mt-1">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Enhanced Features</h3>
                <p className="text-sm text-gray-600">
                  New functionality designed to improve your carbon management experience
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full mt-1">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Stay Updated</h3>
                <p className="text-sm text-gray-600">
                  Get notified when this feature becomes available
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/landing"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Explore Platform
            </Link>
            <Link
              to="/contact"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              In the meantime, explore our existing features or reach out to our team 
              for more information about our roadmap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
