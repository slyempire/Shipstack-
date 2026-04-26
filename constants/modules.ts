
import { ModuleDefinition, ModuleTier, Tenant } from '../types';

export const MODULE_CATEGORIES = [
  { id: 'industry_vertical', label: 'Industry Verticals', description: 'Deep industry-specific logic and UI' },
  { id: 'ai_feature', label: 'Intelligence', description: 'ML and predictive capability add-ons' },
  { id: 'integration', label: 'Connectivity', description: 'ERP, Payment, and SMS gateways' },
  { id: 'addon', label: 'Functional Boost', description: 'Enhanced operations and visibility' },
  { id: 'compliance', label: 'Governance', description: 'Legal and regulatory toolkits' }
];

export const CORE_MODULES: ModuleDefinition[] = [
  {
    id: 'core-dashboard',
    name: 'Unified Dashboard',
    slug: 'dashboard',
    description: 'Central command centre for logistics operations.',
    category: 'core',
    tier: 'free',
    version: '2.4.0',
    versions: [{ version: '2.4.0', releaseDate: new Date().toISOString(), changelog: 'Initial stable release of the unified dashboard.' }],
    icon: 'LayoutDashboard',
    tags: ['core', 'visibility'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'free' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['dashboard:view'], grantedPermissions: ['dashboard:view', 'dashboard:export'] },
    routes: ['/admin/dashboard'],
    isCore: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'core-dispatch',
    name: 'Smart Dispatch',
    slug: 'dispatch',
    description: 'Live assignment and routing engine.',
    category: 'core',
    tier: 'free',
    version: '1.8.2',
    versions: [{ version: '1.8.2', releaseDate: new Date().toISOString(), changelog: 'Optimized dispatch grid performance.' }],
    icon: 'Zap',
    tags: ['core', 'operations'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'free' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['dispatch:view'], grantedPermissions: ['dispatch:view', 'dispatch:manage', 'dispatch:assign'] },
    routes: ['/admin/dispatch'],
    isCore: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'core-fleet',
    name: 'Fleet Control',
    slug: 'fleet',
    description: 'Vehicle lifecycle and maintenance tracking.',
    category: 'core',
    tier: 'free',
    version: '1.0.0',
    versions: [{ version: '1.0.0', releaseDate: new Date().toISOString(), changelog: 'Fleet management module launch.' }],
    icon: 'Truck',
    tags: ['core', 'assets'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'free' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['fleet:view'], grantedPermissions: ['fleet:view', 'fleet:manage', 'fleet:all'] },
    routes: ['/admin/fleet'],
    isCore: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'core-trips',
    name: 'Trip Lifecycle',
    slug: 'trips',
    description: 'End-to-end trip execution and telemetry.',
    category: 'core',
    tier: 'free',
    version: '3.1.0',
    versions: [{ version: '3.1.0', releaseDate: new Date().toISOString(), changelog: 'Advanced telemetry support.' }],
    icon: 'Navigation',
    tags: ['core', 'tracking'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'free' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['trips:view'], grantedPermissions: ['trips:view', 'trips:create', 'trips:edit', 'trips:assign'] },
    routes: ['/admin/trips'],
    isCore: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'core-invoicing',
    name: 'Financial Engine',
    slug: 'invoicing',
    description: 'Automated billing and revenue recognition.',
    category: 'core',
    tier: 'free',
    version: '1.2.0',
    versions: [{ version: '1.2.0', releaseDate: new Date().toISOString(), changelog: 'Support for multi-currency invoicing.' }],
    icon: 'DollarSign',
    tags: ['core', 'finance'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'free' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['finance:view'], grantedPermissions: ['finance:view', 'finance:manage', 'invoicing:view', 'invoicing:all'] },
    routes: ['/admin/invoicing'],
    isCore: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  }
];

export const MARKETPLACE_MODULES: ModuleDefinition[] = [
  {
    id: 'vertical-healthcare',
    name: 'Medical Logistics Pro',
    slug: 'healthcare',
    description: 'Cold chain compliance and pharmaceutical grade handling.',
    longDescription: 'Complete medical logistics solution with temperature monitoring, compliance tracking, and pharmaceutical-grade handling protocols. Ensures regulatory compliance with KEMSA, WHO, and FDA standards.',
    benefits: [
      '100% cold chain compliance guarantee',
      'Real-time temperature monitoring',
      'Regulatory reporting automation',
      'Emergency medical supply prioritization'
    ],
    useCases: [
      'Pharmaceutical distribution',
      'Medical equipment logistics',
      'Vaccine cold chain management',
      'Hospital supply chain'
    ],
    category: 'industry_vertical',
    tier: 'professional',
    version: '1.0.5',
    versions: [
      { version: '1.0.5', releaseDate: '2026-04-15', changelog: 'Added emergency routing and enhanced compliance reporting.' },
      { version: '1.0.0', releaseDate: '2025-12-01', changelog: 'Initial medical module release.' }
    ],
    icon: 'Stethoscope',
    tags: ['medical', 'compliance', 'cold-chain', 'pharmaceutical'],
    publisher: {
      id: 'shipstack',
      name: 'Shipstack Labs',
      verified: true,
      logo: '/logos/shipstack.png',
      website: 'https://shipstack.com',
      supportEmail: 'healthcare@shipstack.com',
      supportPhone: '+254-700-000-001',
      description: 'Leading logistics technology for African markets',
      reviewScore: 4.8,
      totalReviews: 1247
    },
    pricing: {
      model: 'flat',
      amount: 149,
      currency: 'USD',
      billingPeriod: 'monthly',
      annualDiscount: 15
    },
    dependencies: [],
    conflicts: ['vertical-agriculture'],
    permissionScope: { requiredPermissions: ['dashboard:view'], grantedPermissions: ['exceptions:view', 'tracking:view'] },
    routes: ['/admin/vertical/medical'],
    status: 'active',
    createdAt: '2025-12-01T00:00:00Z',
    updatedAt: '2026-04-15T00:00:00Z',
    hooks: {},
    rating: 4.9,
    installCount: 850,
    screenshots: ['/screenshots/healthcare-1.png', '/screenshots/healthcare-2.png'],
    reviews: [
      {
        id: 'review-1',
        userId: 'user-1',
        userName: 'Dr. Sarah Johnson',
        userAvatar: '/avatars/sarah.jpg',
        rating: 5,
        title: 'Excellent for medical logistics',
        content: 'This module has transformed our vaccine distribution. The cold chain monitoring is exceptional.',
        createdAt: '2026-04-10T00:00:00Z',
        helpful: 12,
        verified: true,
        version: '1.0.5'
      },
      {
        id: 'review-2',
        userId: 'user-2',
        userName: 'Medical Logistics Manager',
        rating: 4,
        title: 'Good but needs more customization',
        content: 'Solid foundation for medical logistics, but would like more temperature alert configurations.',
        createdAt: '2026-04-05T00:00:00Z',
        helpful: 8,
        verified: true,
        version: '1.0.4'
      }
    ],
    certifications: ['HIPAA Compliant', 'WHO Certified', 'KEMSA Approved'],
    setupComplexity: 'Moderate',
    setupTimeEstimate: '2-3 hours',
    documentationUrl: 'https://docs.shipstack.com/healthcare-module',
    videoTutorialUrl: 'https://youtube.com/watch?v=healthcare-setup',
    faqs: [
      {
        question: 'Does this support multiple temperature zones?',
        answer: 'Yes, the module supports 2-8°C, 15-25°C, and frozen storage zones.'
      },
      {
        question: 'Is it KEMSA compliant?',
        answer: 'Yes, fully compliant with Kenyan Medical Supplies Agency requirements.'
      }
    ],
    knownIssues: ['Temperature sensor calibration may require on-site technician'],
    relatedModules: ['addon-fraud-guard', 'addon-advanced-analytics'],
    changelog: 'Added emergency routing and enhanced compliance reporting.',
    lastUpdated: '2026-04-15'
  },
  {
    id: 'vertical-agriculture',
    name: 'Agri-Supply Network',
    slug: 'agriculture',
    description: 'Farm-to-market visibility and harvest yield logistics.',
    longDescription: 'Comprehensive agricultural supply chain management with real-time harvest tracking, perishability monitoring, and market demand forecasting. Optimized for fresh produce and bulk commodity logistics.',
    benefits: [
      'Reduce post-harvest losses by up to 40%',
      'Real-time harvest-to-market visibility',
      'Automated perishability alerts',
      'Market price optimization'
    ],
    useCases: [
      'Fresh produce distribution',
      'Bulk grain logistics',
      'Perishable goods transport',
      'Farm cooperative management'
    ],
    category: 'industry_vertical',
    tier: 'professional',
    version: '1.2.0',
    versions: [
      { version: '1.2.0', releaseDate: '2026-04-20', changelog: 'Added market price integration and enhanced perishability tracking.' },
      { version: '1.0.0', releaseDate: '2026-01-10', changelog: 'Agriculture module launch.' }
    ],
    icon: 'Sprout',
    tags: ['agriculture', 'freshness', 'farm', 'perishable'],
    publisher: {
      id: 'shipstack',
      name: 'Shipstack Labs',
      verified: true,
      logo: '/logos/shipstack.png',
      website: 'https://shipstack.com',
      supportEmail: 'agriculture@shipstack.com',
      supportPhone: '+254-700-000-002',
      description: 'Leading logistics technology for African markets',
      reviewScore: 4.7,
      totalReviews: 892
    },
    pricing: {
      model: 'flat',
      amount: 149,
      currency: 'USD',
      billingPeriod: 'monthly',
      annualDiscount: 15
    },
    dependencies: [],
    conflicts: ['vertical-healthcare'],
    permissionScope: { requiredPermissions: ['dashboard:view'], grantedPermissions: ['tracking:view'] },
    routes: ['/admin/vertical/agriculture'],
    status: 'active',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-04-20T00:00:00Z',
    hooks: {},
    rating: 4.8,
    installCount: 1200,
    screenshots: ['/screenshots/agriculture-1.png', '/screenshots/agriculture-2.png'],
    reviews: [
      {
        id: 'review-3',
        userId: 'user-3',
        userName: 'Farm Manager Ken',
        userAvatar: '/avatars/ken.jpg',
        rating: 5,
        title: 'Game changer for our farm logistics',
        content: 'The perishability tracking has helped us reduce losses significantly. Highly recommend!',
        createdAt: '2026-04-18T00:00:00Z',
        helpful: 15,
        verified: true,
        version: '1.2.0'
      }
    ],
    certifications: ['HACCP Certified', 'Organic Compliance Ready'],
    setupComplexity: 'Simple',
    setupTimeEstimate: '1-2 hours',
    documentationUrl: 'https://docs.shipstack.com/agriculture-module',
    videoTutorialUrl: 'https://youtube.com/watch?v=agriculture-setup',
    faqs: [
      {
        question: 'Does this work for bulk grains?',
        answer: 'Yes, supports both fresh produce and bulk commodity logistics.'
      }
    ],
    relatedModules: ['addon-advanced-analytics', 'addon-cortex-ai'],
    changelog: 'Added market price integration and enhanced perishability tracking.',
    lastUpdated: '2026-04-20'
  },
  {
    id: 'vertical-ecommerce',
    name: 'E-commerce Last Mile',
    slug: 'ecommerce',
    description: 'Hyper-local delivery optimization and courier network management.',
    category: 'industry_vertical',
    tier: 'starter',
    version: '2.0.1',
    versions: [{ version: '2.0.0', releaseDate: '2026-02-15', changelog: 'Rebuilt for high volume.' }],
    icon: 'ShoppingBag',
    tags: ['retail', 'speed', 'hyper-local'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'flat', amount: 79, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['dashboard:view'], grantedPermissions: ['orders:create'] },
    routes: ['/admin/vertical/ecommerce'],
    status: 'active',
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'vertical-retail',
    name: 'Retail Distribution',
    slug: 'retail',
    description: 'Store replenishment and omnichannel fulfillment.',
    category: 'industry_vertical',
    tier: 'starter',
    version: '1.1.0',
    versions: [],
    icon: 'Archive',
    tags: ['retail', 'warehouse', 'inventory'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'flat', amount: 79, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['dashboard:view'], grantedPermissions: ['warehouse:view'] },
    routes: ['/admin/vertical/retail'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'vertical-coldchain',
    name: 'Cold Chain Guardian',
    slug: 'coldchain',
    description: 'Real-time temperature monitoring and integrity reporting.',
    category: 'industry_vertical',
    tier: 'enterprise',
    version: '1.0.0',
    versions: [],
    icon: 'Flame',
    tags: ['temp-control', 'iot', 'sensors'],
    publisher: { id: 'iot-partner', name: 'ColdSense IoT', verified: true },
    pricing: { model: 'flat', amount: 299, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['analytics:view'], grantedPermissions: ['analytics:all'] },
    routes: ['/admin/vertical/coldchain'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'vertical-construction',
    name: 'Heavy Materials Ops',
    slug: 'construction',
    description: 'Bulk material dispatch and construction site coordinate tracking.',
    category: 'industry_vertical',
    tier: 'enterprise',
    version: '0.9.0',
    versions: [],
    icon: 'Scale',
    tags: ['bulk', 'construction', 'heavy-load'],
    publisher: { id: 'raw-materials', name: 'BuildLogix', verified: false },
    pricing: { model: 'flat', amount: 299, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['fleet:manage'], grantedPermissions: ['fleet:all'] },
    routes: ['/admin/vertical/construction'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'addon-cortex-ai',
    name: 'Cortex AI Optimizer',
    slug: 'cortex-ai',
    description: 'ML-driven delay prediction and automated resource allocation.',
    longDescription: 'Advanced artificial intelligence system that predicts delivery delays, optimizes routes in real-time, and automates resource allocation. Uses machine learning algorithms trained on millions of delivery data points.',
    benefits: [
      '94% accuracy in delay prediction',
      'Up to 25% reduction in delivery times',
      'Automated route optimization',
      'Real-time traffic adaptation'
    ],
    useCases: [
      'Urban delivery optimization',
      'Long-haul route planning',
      'Emergency delivery prioritization',
      'Fleet utilization optimization'
    ],
    category: 'ai_feature',
    tier: 'professional',
    version: '2.5.0',
    versions: [
      { version: '2.5.0', releaseDate: '2026-04-25', changelog: 'Enhanced real-time traffic integration and improved prediction accuracy.' },
      { version: '2.0.0', releaseDate: '2026-03-01', changelog: 'Major AI model upgrade with 30% better predictions.' },
      { version: '1.0.0', releaseDate: '2026-01-15', changelog: 'Initial AI optimizer release.' }
    ],
    icon: 'Zap',
    tags: ['ai', 'optimization', 'ml', 'automation', 'predictive'],
    publisher: {
      id: 'shipstack',
      name: 'Shipstack Labs',
      verified: true,
      logo: '/logos/shipstack.png',
      website: 'https://shipstack.com',
      supportEmail: 'ai@shipstack.com',
      supportPhone: '+254-700-000-003',
      description: 'Leading AI-powered logistics technology',
      reviewScore: 4.9,
      totalReviews: 420
    },
    pricing: {
      model: 'flat',
      amount: 199,
      currency: 'USD',
      billingPeriod: 'monthly',
      annualDiscount: 20
    },
    dependencies: ['core-dispatch'],
    conflicts: [],
    permissionScope: { requiredPermissions: ['dispatch:manage'], grantedPermissions: ['analytics:view'] },
    routes: [],
    isFeatured: true,
    status: 'active',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-25T00:00:00Z',
    hooks: {},
    rating: 4.9,
    installCount: 420,
    screenshots: ['/screenshots/cortex-ai-1.png', '/screenshots/cortex-ai-2.png'],
    reviews: [
      {
        id: 'review-4',
        userId: 'user-4',
        userName: 'Operations Director',
        userAvatar: '/avatars/ops-director.jpg',
        rating: 5,
        title: 'Revolutionary AI optimization',
        content: 'The AI predictions are incredibly accurate. We\'ve seen a 25% improvement in on-time deliveries.',
        createdAt: '2026-04-22T00:00:00Z',
        helpful: 23,
        verified: true,
        version: '2.5.0'
      },
      {
        id: 'review-5',
        userId: 'user-5',
        userName: 'Logistics Manager',
        rating: 5,
        title: 'Game-changing technology',
        content: 'The automated route optimization saves us hours every day. Highly recommend for any serious logistics operation.',
        createdAt: '2026-04-20T00:00:00Z',
        helpful: 18,
        verified: true,
        version: '2.5.0'
      }
    ],
    certifications: ['ISO 27001', 'GDPR Compliant', 'AI Ethics Certified'],
    setupComplexity: 'Complex',
    setupTimeEstimate: '4-6 hours',
    documentationUrl: 'https://docs.shipstack.com/cortex-ai',
    videoTutorialUrl: 'https://youtube.com/watch?v=cortex-ai-setup',
    faqs: [
      {
        question: 'How accurate are the predictions?',
        answer: 'Our models achieve 94% accuracy in delay prediction based on historical data analysis.'
      },
      {
        question: 'Does it work in real-time?',
        answer: 'Yes, the system provides real-time route optimization and traffic adaptation.'
      }
    ],
    knownIssues: ['Requires minimum 3 months of historical data for optimal performance'],
    relatedModules: ['addon-advanced-analytics', 'vertical-ecommerce'],
    changelog: 'Enhanced real-time traffic integration and improved prediction accuracy.',
    lastUpdated: '2026-04-25'
  },
  {
    id: 'addon-advanced-analytics',
    name: 'Insight Hub Pro',
    slug: 'advanced-analytics',
    description: 'Deep-dive reporting and custom BI dashboarding.',
    longDescription: 'Advanced business intelligence platform with custom dashboards, predictive analytics, and comprehensive reporting. Transform your logistics data into actionable business insights.',
    benefits: [
      'Custom dashboard creation',
      'Predictive analytics integration',
      'Real-time KPI monitoring',
      'Advanced data visualization'
    ],
    useCases: [
      'Executive reporting',
      'Performance analytics',
      'Trend analysis',
      'Custom metric tracking'
    ],
    category: 'addon',
    tier: 'professional',
    version: '1.4.2',
    versions: [
      { version: '1.4.2', releaseDate: '2026-04-18', changelog: 'Added predictive analytics integration and enhanced dashboard customization.' },
      { version: '1.0.0', releaseDate: '2026-02-01', changelog: 'Initial analytics platform release.' }
    ],
    icon: 'Activity',
    tags: ['analytics', 'bi', 'data', 'reporting', 'dashboards'],
    publisher: {
      id: 'shipstack',
      name: 'Shipstack Core',
      verified: true,
      logo: '/logos/shipstack.png',
      website: 'https://shipstack.com',
      supportEmail: 'analytics@shipstack.com',
      supportPhone: '+254-700-000-004',
      description: 'Leading logistics analytics platform',
      reviewScore: 4.6,
      totalReviews: 387
    },
    pricing: {
      model: 'flat',
      amount: 99,
      currency: 'USD',
      billingPeriod: 'monthly',
      annualDiscount: 10
    },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['analytics:view'], grantedPermissions: ['analytics:all', 'analytics:export'] },
    routes: ['/admin/analytics/pro'],
    status: 'active',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-04-18T00:00:00Z',
    hooks: {},
    rating: 4.7,
    installCount: 650,
    screenshots: ['/screenshots/analytics-1.png', '/screenshots/analytics-2.png'],
    reviews: [
      {
        id: 'review-6',
        userId: 'user-6',
        userName: 'Data Analyst',
        userAvatar: '/avatars/analyst.jpg',
        rating: 4,
        title: 'Powerful analytics capabilities',
        content: 'The custom dashboards are excellent, but the learning curve is steep. Worth it for the insights.',
        createdAt: '2026-04-15T00:00:00Z',
        helpful: 9,
        verified: true,
        version: '1.4.2'
      }
    ],
    certifications: ['SOC 2 Type II', 'GDPR Compliant'],
    setupComplexity: 'Moderate',
    setupTimeEstimate: '2-4 hours',
    documentationUrl: 'https://docs.shipstack.com/analytics',
    videoTutorialUrl: 'https://youtube.com/watch?v=analytics-setup',
    faqs: [
      {
        question: 'Can I create custom dashboards?',
        answer: 'Yes, the platform includes a drag-and-drop dashboard builder.'
      }
    ],
    relatedModules: ['addon-cortex-ai', 'vertical-retail'],
    changelog: 'Added predictive analytics integration and enhanced dashboard customization.',
    lastUpdated: '2026-04-18'
  },
  {
    id: 'addon-route-optimizer',
    name: 'Route Wizard',
    slug: 'route-optimizer',
    description: 'Multi-stop TSP solver for urban delivery routes.',
    category: 'addon',
    tier: 'starter',
    version: '1.0.0',
    versions: [],
    icon: 'RouteIcon',
    tags: ['routing', 'speed', 'optimization'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'flat', amount: 49, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: ['core-dispatch'],
    conflicts: [],
    permissionScope: { requiredPermissions: ['dispatch:assign'], grantedPermissions: ['dispatch:manage'] },
    routes: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'addon-customer-portal',
    name: 'White-Label Portal',
    slug: 'customer-portal',
    description: 'Your own branded tracking and ordering interface for clients.',
    category: 'addon',
    tier: 'starter',
    version: '1.2.0',
    versions: [],
    icon: 'Pin',
    tags: ['portal', 'branding', 'customers'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'flat', amount: 29, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['orders:view'], grantedPermissions: ['users:invite'] },
    routes: ['/portal/config'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'addon-driver-app-pro',
    name: 'Driver App Pro',
    slug: 'driver-app-pro',
    description: 'Offline support, barcode scanning, and multi-language for drivers.',
    category: 'addon',
    tier: 'professional',
    version: '2.0.0',
    versions: [],
    icon: 'Truck',
    tags: ['driver', 'offline', 'scanning'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'flat', amount: 79, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: ['core-trips'],
    conflicts: [],
    permissionScope: { requiredPermissions: ['trips:view'], grantedPermissions: ['trips:edit'] },
    routes: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'integration-frappe-erp',
    name: 'Frappe / ERPNext Hub',
    slug: 'frappe-erp',
    description: 'Two-way sync for sales orders, delivery notes, and stock levels.',
    category: 'integration',
    tier: 'professional',
    version: '3.1.2',
    versions: [],
    icon: 'RefreshCw',
    tags: ['erp', 'sync', 'automation'],
    publisher: { id: 'frappe-partners', name: 'Frappe Certified', verified: true },
    pricing: { model: 'flat', amount: 99, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['data_ingress:view'], grantedPermissions: ['data_ingress:manage'] },
    routes: ['/admin/ingress/frappe'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'integration-quickbooks',
    name: 'QuickBooks Sync',
    slug: 'quickbooks',
    description: 'Automatic invoice generation and payment reconciliation.',
    category: 'integration',
    tier: 'starter',
    version: '1.0.1',
    versions: [],
    icon: 'CheckCircle',
    tags: ['accounting', 'finance', 'sync'],
    publisher: { id: 'intuit', name: 'Intuit Marketplace', verified: true },
    pricing: { model: 'flat', amount: 39, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: ['core-invoicing'],
    conflicts: [],
    permissionScope: { requiredPermissions: ['finance:view'], grantedPermissions: ['finance:manage'] },
    routes: ['/admin/finance/quickbooks'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'integration-shopify',
    name: 'Shopify Connector',
    slug: 'shopify',
    description: 'Fulfill Shopify orders directly within the Shipstack grid.',
    category: 'integration',
    tier: 'starter',
    version: '2.1.0',
    versions: [],
    icon: 'Package',
    tags: ['e-commerce', 'orders', 'sync'],
    publisher: { id: 'shopify', name: 'Shopify Partners', verified: true },
    pricing: { model: 'flat', amount: 39, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['orders:view'], grantedPermissions: ['orders:create'] },
    routes: ['/admin/ingress/shopify'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'integration-mpesa',
    name: 'M-Pesa Gateway',
    slug: 'mpesa',
    description: 'Direct STK push for driver collections and B2C disbursements.',
    category: 'integration',
    tier: 'free',
    version: '2.0.0',
    versions: [],
    icon: 'Zap',
    tags: ['payments', 'kenya', 'mobile-money'],
    publisher: { id: 'safaricom', name: 'Safaricom Open API', verified: true },
    pricing: { model: 'free' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['finance:view'], grantedPermissions: ['finance:manage'] },
    routes: ['/admin/finance/mpesa'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'integration-stripe',
    name: 'Stripe Payments',
    slug: 'stripe',
    description: 'Accept credit card payments for enterprise invoices globally.',
    category: 'integration',
    tier: 'free',
    version: '1.0.0',
    versions: [],
    icon: 'DollarSign',
    tags: ['payments', 'global', 'card'],
    publisher: { id: 'stripe', name: 'Stripe Partners', verified: true },
    pricing: { model: 'free' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['finance:view'], grantedPermissions: ['finance:manage'] },
    routes: ['/admin/finance/stripe'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'compliance-gdpr-toolkit',
    name: 'GDPR Compliance Kit',
    slug: 'gdpr',
    description: 'Automated data deletion, PII masking, and consent management.',
    category: 'compliance',
    tier: 'professional',
    version: '1.0.0',
    versions: [],
    icon: 'ShieldCheck',
    tags: ['privacy', 'eu', 'security'],
    publisher: { id: 'shipstack', name: 'Shipstack Core', verified: true },
    pricing: { model: 'flat', amount: 79, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['audit:view'], grantedPermissions: ['users:edit'] },
    routes: ['/admin/security/gdpr'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  },
  {
    id: 'compliance-iso-28000',
    name: 'ISO 28000 Auditor',
    slug: 'iso-28000',
    description: 'Supply chain security management system certification tooling.',
    category: 'compliance',
    tier: 'enterprise',
    version: '1.0.0',
    versions: [],
    icon: 'Scale',
    tags: ['iso', 'security', 'audit'],
    publisher: { id: 'compliance-experts', name: 'SafeOps Global', verified: true },
    pricing: { model: 'flat', amount: 199, currency: 'USD', billingPeriod: 'monthly' },
    dependencies: [],
    conflicts: [],
    permissionScope: { requiredPermissions: ['audit:view'], grantedPermissions: ['audit:export'] },
    routes: ['/admin/security/iso'],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hooks: {}
  }
];

export const MODULE_LIFECYCLE_RULES = {
  maxTrialExtensions: 1,
  autoSuspendAfterDays: 3,
  deprecationNoticeDays: 90,
  requiredReviewForPublish: true,
  maxModulesPerTier: {
    free: 2,
    starter: 3,
    growth: 5,
    professional: 10,
    scale: 20,
    enterprise: 'unlimited'
  }
};

export const getModuleById = (id: string): ModuleDefinition | undefined => {
  return [...CORE_MODULES, ...MARKETPLACE_MODULES].find(m => m.id === id || m.slug === id);
};

export const getModulesForTier = (tier: Tenant['plan']): ModuleDefinition[] => {
  const tiers: Record<string, number> = { 'STARTER': 1, 'GROWTH': 2, 'SCALE': 3, 'ENTERPRISE': 4 };
  const currentTierRank = tiers[tier] || 0;
  
  return MARKETPLACE_MODULES.filter(m => {
    const moduleTierRank = tiers[m.tier.toUpperCase()] || 0;
    return moduleTierRank <= currentTierRank;
  });
};

export const checkModuleDependencies = (moduleId: string, installedModules: string[]): { canInstall: boolean; missing: string[] } => {
  const module = getModuleById(moduleId);
  if (!module) return { canInstall: false, missing: [] };
  
  const missing = module.dependencies
    .filter(dep => !installedModules.includes(dep.moduleId))
    .map(dep => dep.moduleId);
    
  return {
    canInstall: missing.length === 0,
    missing
  };
};

export const checkModuleConflicts = (moduleId: string, installedModules: string[]): { hasConflict: boolean; conflicting: string[] } => {
  const module = getModuleById(moduleId);
  if (!module) return { hasConflict: false, conflicting: [] };
  
  const conflicting = module.conflicts.filter(conflictId => installedModules.includes(conflictId));
  
  return {
    hasConflict: conflicting.length > 0,
    conflicting
  };
};

export const getModuleUpgradePath = (currentVersion: string, module: ModuleDefinition): string | null => {
  const currentIndex = module.versions.findIndex(v => v.version === currentVersion);
  if (currentIndex === -1 || currentIndex === module.versions.length - 1) return null;
  return module.versions[currentIndex + 1].version;
};
