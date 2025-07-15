import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useVerification } from '../../hooks/useVerification';
import { 
  Cloud, 
  FileText, 
  Home, 
  ShoppingCart,
  Leaf,
  Key,
  TreePine,
  Coins,
  BarChart3,
  Shield,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

const buyerNavigation = [
  { name: 'Dashboard', href: '/app/buyer/dashboard', icon: Home },
  { name: 'Emissions', href: '/app/emissions', icon: Cloud },
  { name: 'Marketplace', href: '/app/marketplace', icon: ShoppingCart },
  { name: 'Offsets', href: '/app/offsets', icon: Leaf },
  { name: 'Reports', href: '/app/reports', icon: FileText },
  { name: 'API Access', href: '/app/api', icon: Key },
];

const sellerNavigation = [
  { name: 'Seller Dashboard', href: '/app/seller/dashboard', icon: Home },
  { name: 'Projects', href: '/app/seller/projects', icon: TreePine },
  { name: 'Credits', href: '/app/seller/credits', icon: Coins },
  { name: 'Sales', href: '/app/seller/sales', icon: BarChart3 },
  { name: 'Verification', href: '/app/seller/verification', icon: Shield },
  { name: 'Marketplace', href: '/app/marketplace', icon: ShoppingCart },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/app/admin/dashboard', icon: Home },
  { name: 'User Management', href: '/app/admin/users', icon: Users },
  { name: 'Verifications', href: '/app/admin/verifications', icon: Shield },
  { name: 'Projects Review', href: '/app/admin/projects', icon: TreePine },
  { name: 'Marketplace', href: '/app/marketplace', icon: ShoppingCart },
  { name: 'Reports', href: '/app/reports', icon: FileText },
];

export default function Sidebar() {
  const { user } = useAuthStore();

  const getNavigation = () => {
    if (user?.type === 'seller') return sellerNavigation;
    if (user?.type === 'admin') return adminNavigation;
    return buyerNavigation;
  };

  const navigation = getNavigation();

  return (
    <div className="bg-gray-900 w-64 h-full">
      <nav className="mt-2 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
