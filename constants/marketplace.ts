
import { IndustryType, ModuleId } from '../types';
import { 
  Sprout, 
  Stethoscope, 
  ShoppingCart, 
  Package, 
  Zap, 
  ShieldCheck, 
  Thermometer,
  Boxes,
  Truck,
  Database
} from 'lucide-react';

export interface Solution {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'INDUSTRY' | 'ADD-ON' | 'INTEGRATION';
  industry?: IndustryType;
  modules?: ModuleId[];
  provider: string;
  rating: number;
  installs: string;
  price: string;
  tags: string[];
  features: string[];
  backgroundImage?: string;
}

export const SOLUTIONS_MARKETPLACE: Solution[] = [
  {
    id: 'industry-agriculture',
    name: 'Agriculture Intelligence',
    description: 'Specialized supply chain management for farm-to-fork tracking, perishability management, and regional market distribution.',
    icon: Sprout,
    category: 'INDUSTRY',
    industry: 'AGRICULTURE',
    modules: ['dispatch', 'fleet', 'analytics'],
    provider: 'Shipstack Native',
    rating: 4.9,
    installs: '1.2k',
    price: 'Free',
    tags: ['Fresh Produce', 'Cold Chain', 'Regional'],
    features: [
      'Farm-to-Warehouse Tracking',
      'Perishability/Expiry Monitoring',
      'Regional Market Yield Analysis',
      'Bulk Transporter Management'
    ],
    backgroundImage: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'industry-healthcare',
    name: 'Healthcare & Pharma',
    description: 'ISO-compliant cold chain logistics, medical supply tracking, and emergency facility dispatching for high-priority health goods.',
    icon: Stethoscope,
    category: 'INDUSTRY',
    industry: 'HEALTHCARE',
    modules: ['dispatch', 'warehouse', 'integrations'],
    provider: 'Shipstack Native',
    rating: 5.0,
    installs: '850',
    price: 'Free',
    tags: ['Medical', 'Compliance', 'High Priority'],
    features: [
      'Validated Temp Monitoring (2°C-8°C)',
      'Last-Mile Facility Dispatch',
      'WHO Compliance Guardrails',
      'Emergency Route Optimization'
    ],
    backgroundImage: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'industry-ecommerce',
    name: 'E-commerce Engine',
    description: 'High-velocity last-mile delivery, return management, and COD reconciliation for modern online retail platforms.',
    icon: ShoppingCart,
    category: 'INDUSTRY',
    industry: 'E-COMMERCE',
    modules: ['orders', 'dispatch', 'client-portal'],
    provider: 'Shipstack Native',
    rating: 4.8,
    installs: '3.4k',
    price: 'Free',
    tags: ['Last Mile', 'COD', 'Boda-Friendly'],
    features: [
      'Automated COD Reconciliation',
      'M-Pesa Integration (B2C)',
      'Intelligent Route Batching',
      'Reverse Logistics Workflow'
    ],
    backgroundImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'industry-retail',
    name: 'Modern Retail Stack',
    description: 'Stock replenishment, cross-docking operations, and distributed warehouse management for retail chains and distributors.',
    icon: Boxes,
    category: 'INDUSTRY',
    industry: 'RETAIL',
    modules: ['warehouse', 'orders', 'finance'],
    provider: 'Shipstack Native',
    rating: 4.7,
    installs: '2.1k',
    price: 'Free',
    tags: ['Distribution', 'Inventory', 'B2B'],
    features: [
      'Cross-docking Management',
      'Inventory Threshold Alerts',
      'Bulk Order Processing',
      'Distributor Rate Management'
    ],
    backgroundImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'addon-ai-dispatch',
    name: 'Cortex AI Optimizer',
    description: 'Advanced machine learning engine for predictive load balancing and autonomous dispatch planning.',
    icon: Zap,
    category: 'ADD-ON',
    modules: ['analytics'],
    provider: 'Shipstack Labs',
    rating: 4.9,
    installs: '420',
    price: 'Growth+',
    tags: ['ML', 'Automation', 'AI'],
    features: [
      'Predictive Delivery Lag Detection',
      'Autonomous Vehicle Assignment',
      'Traffic-Aware Slot Booking',
      'Dynamic Pricing Engine'
    ],
    backgroundImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'addon-fraud-guard',
    name: 'FraudGuard Enterprise',
    description: 'Multi-layered protection against delivery spoofing, theft, and inventory leakage.',
    icon: ShieldCheck,
    category: 'ADD-ON',
    modules: ['fleet'],
    provider: 'Cyber-Log Co.',
    rating: 4.6,
    installs: '1.5k',
    price: 'Scale+',
    tags: ['Security', 'Verification', 'Anti-Theft'],
    features: [
      'GPS Spoofing Detection',
      'Biometric POD Verification',
      'Unexpected Deviation Alerts',
      'Inventory Shrinkage Audit'
    ]
  },
  {
    id: 'integration-sap',
    name: 'SAP S/4HANA Connector',
    description: 'Native seamless synchronization between Shipstack and your ERP core.',
    icon: Database,
    category: 'INTEGRATION',
    modules: ['integrations'],
    provider: 'SAP Certified Partner',
    rating: 4.5,
    installs: '300',
    price: 'Enterprise',
    tags: ['ERP', 'Enterprise', 'SAP'],
    features: [
      'OData v2/v4 Support',
      'Bidirectional Order Sync',
      'Real-time Inventory Mapping',
      'ISO 27001 Certified Link'
    ]
  }
];
