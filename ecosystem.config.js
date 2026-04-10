// PM2 Ecosystem Config — Podwires Community
// Place this at: /home/podwires/community/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'community-api',
      script: './server/src/index.js',
      cwd: '/home/podwires/community',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      // Logging
      out_file: '/home/podwires/logs/api.out.log',
      error_file: '/home/podwires/logs/api.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
    {
      name: 'community-client',
      script: 'npm',
      args: 'start',
      cwd: '/home/podwires/community/client',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      out_file: '/home/podwires/logs/client.out.log',
      error_file: '/home/podwires/logs/client.err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
    },
  ],
};
