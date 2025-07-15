import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Zap, Building2, Globe, Star } from 'lucide-react';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Perfect for small businesses getting started with carbon tracking',
      features: [
        'Up to 100 emission entries per month',
        'Basic emission tracking',
        'Standard marketplace access',
        'Email support',
        'Basic analytics dashboard',
        'Up to 5 team members'
      ],
      apiLimits: {
        requests: '1,000 requests/month',
        rateLimit: '10 requests/minute',
        features: ['Emission estimation API', 'Basic offset API']
      },
      cta: 'Get Started Free',
      ctaLink: '/register',
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      description: 'Ideal for growing companies with serious sustainability goals',
      features: [
        'Up to 1,000 emission entries per month',
        'Advanced emission tracking with categorization',
        'Priority marketplace access',
        'AI-powered recommendations',
        'Advanced analytics and reporting',
        'Up to 25 team members',
        'Blockchain verification certificates',
        'Email & chat support'
      ],
      apiLimits: {
        requests: '10,000 requests/month',
        rateLimit: '100 requests/minute',
        features: ['Full API access', 'Webhook notifications', 'Bulk operations']
      },
      cta: 'Start Free Trial',
      ctaLink: '/register?plan=professional',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with complex sustainability requirements',
      features: [
        'Unlimited emission entries',
        'Custom emission factors and categories',
        'White-label marketplace',
        'Advanced AI insights and predictions',
        'Custom reporting and dashboards',
        'Unlimited team members',
        'Dedicated blockchain infrastructure',
        'Premium support with SLA',
        'Custom integrations',
        'Compliance audit support'
      ],
      apiLimits: {
        requests: 'Unlimited requests',
        rateLimit: 'Custom rate limits',
        features: ['Full API access', 'Custom endpoints', 'Dedicated infrastructure']
      },
      cta: 'Contact Sales',
      ctaLink: '/contact',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transparent Pricing for Every Business
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Choose the perfect plan for your carbon offsetting needs. All plans include blockchain verification and full marketplace access.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg border-2 ${
                  plan.popular ? 'border-green-500' : 'border-gray-200'
                } p-8 hover:shadow-xl transition-shadow`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 'Custom' ? plan.price : `$${plan.price}`}
                    </span>
                    {plan.price !== 'Custom' && plan.price !== 'Free' && (
                      <span className="text-gray-600">/month</span>
                    )}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Platform Features:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    API Limits:
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Requests:</span>
                      <span className="font-medium">{plan.apiLimits.requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate Limit:</span>
                      <span className="font-medium">{plan.apiLimits.rateLimit}</span>
                    </div>
                    <div className="mt-3">
                      <span className="block mb-2">Features:</span>
                      <ul className="space-y-1">
                        {plan.apiLimits.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <Link
                  to={plan.ctaLink}
                  className={`w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Details Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                API-as-a-Service Details
              </h2>
              <p className="text-lg text-gray-600">
                Integrate carbon offsetting directly into your applications
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Emission Estimation API</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Calculate carbon emissions for various activities including flights, shipping, energy consumption, and more.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Real-time emission calculations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Multiple activity types supported</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Accurate emission factors</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Globe className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold">Offset Purchase API</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Automatically purchase and retire carbon credits with blockchain verification and certificate generation.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Instant offset purchases</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Blockchain verification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>NFT certificates</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/api-docs"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                View API Documentation
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I upgrade or downgrade my plan at any time?
                </h3>
                <p className="text-gray-600">
                  Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades take effect at the next billing cycle.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What happens if I exceed my API limits?
                </h3>
                <p className="text-gray-600">
                  If you exceed your monthly API requests, additional requests will be charged at $0.01 per request. Rate limit overages will result in temporary throttling.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Are the carbon credits verified and legitimate?
                </h3>
                <p className="text-gray-600">
                  Yes, all carbon credits on our platform are from verified projects meeting international standards like VCS, Gold Standard, and others. Each credit is backed by blockchain verification.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer custom enterprise solutions?
                </h3>
                <p className="text-gray-600">
                  Yes, our Enterprise plan includes custom integrations, white-label solutions, and dedicated support. Contact our sales team for a tailored solution.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Carbon Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies already offsetting their carbon footprint with blockchain transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="border border-green-300 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
