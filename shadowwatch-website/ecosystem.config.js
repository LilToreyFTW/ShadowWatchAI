/**
 * PM2 Ecosystem Configuration for ShadowWatch AI
 * Windows-compatible process management
 */

module.exports = {
  apps: [
    {
      name: 'shadowwatch-website',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 8080,
        API_PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        API_PORT: 3000
      },
      error_file: './logs/website-error.log',
      out_file: './logs/website-out.log',
      log_file: './logs/website.log',
      merge_logs: true,
      time: true,
      watch: false,
      max_memory_restart: '256M',
      restart_delay: 1000,
      autorestart: true,
      // Windows-specific settings
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'shadowwatch-api',
      script: './deployment/server.js',
      cwd: '../shadowwatch-ai',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '../shadowwatch-website/logs/api-error.log',
      out_file: '../shadowwatch-website/logs/api-out.log',
      log_file: '../shadowwatch-website/logs/api.log',
      merge_logs: true,
      time: true,
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 2000,
      autorestart: true,
      // Windows-specific settings
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 15000
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/shadowwatch-ai.git',
      path: '/var/www/shadowwatch-ai',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
