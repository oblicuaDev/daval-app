// PM2 process definition — usado por deploy.sh
// pm2 startOrReload infra/ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'daval-api',
      cwd: '/var/www/davalapp/api',
      script: 'src/index.js',
      node_args: '--enable-source-maps',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '350M',
      env: {
        NODE_ENV: 'production',
        TZ: 'America/Bogota',
      },
      env_production: {
        NODE_ENV: 'production',
        TZ: 'America/Bogota',
      },
      out_file: '/var/log/daval/api.out.log',
      error_file: '/var/log/daval/api.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
