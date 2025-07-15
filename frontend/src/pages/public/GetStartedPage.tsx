import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShoppingCart, Coins, ArrowRight, CheckCircle } from 'lucide-react';

export default function GetStartedPage() {
  const navigate = useNavigate();

  const buyerFeatures = [
    'Track carbon emissions',
    'Get AI-powered recommendations',
    'Purchase verified carbon credits',
    'Generate compliance reports',
    'Monitor progress toward net-zero'
  ];

  const sellerFeatures = [
    'List carbon reduction projects',
    'Create and mint carbon credits',
    'Access global marketplace',
    'Track sales and revenue',
    'Verified project certification'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Path to Carbon Neutrality
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're looking to offset your carbon footprint or create carbon credits 
            from your environmental projects, we have the right solution for you.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Buy Credits Option */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Buy Carbon Credits</h2>
                <p className="text-gray-600">
                  Perfect for companies looking to offset their carbon emissions and achieve net-zero goals
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {buyerFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/register')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Start Buying Credits
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Sign In as Buyer
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 text-center">
                  <strong>Best for:</strong> Corporations, SMEs, and organizations looking to become carbon neutral
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sell Credits Option */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Coins className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sell Carbon Credits</h2>
                <p className="text-gray-600">
                  Ideal for project developers and organizations with verified carbon reduction projects
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {sellerFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/seller/register')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  Start Selling Credits
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Sign In as Seller
                </Button>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 text-center">
                  <strong>Best for:</strong> Project developers, renewable energy companies, and conservation organizations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Button 
            onClick={() => navigate('/landing')}
            variant="outline"
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
