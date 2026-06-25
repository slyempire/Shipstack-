export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow scopes relevant to Shipstack modules
    'scope-enum': [
      2,
      'always',
      [
        'admin', 'dispatch', 'driver', 'facility', 'client',
        'auth', 'api', 'store', 'hooks', 'types',
        'marketing', 'landing', 'pricing',
        'kpi', 'ui', 'layout', 'css',
        'ci', 'deploy', 'deps', 'config',
        'tests', 'e2e',
        'supabase', 'socket', 'ai', 'mpesa', 'frappe',
        'fleet', 'warehouse', 'orders', 'crm', 'billing',
      ]
    ],
    // Subjects must not end with a period
    'subject-full-stop': [2, 'never', '.'],
    // Subjects must be sentence-case or lower-case
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
  },
};