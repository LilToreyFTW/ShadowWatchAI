# ShadowWatch AI Website

A modern, responsive marketing website for ShadowWatch AI built with Express.js, featuring moon-themed design, interactive elements, and Vercel deployment support.

## 🌙 Features

- **Moon-Themed UI**: Vivid dark blue moon aesthetic with 3D effects
- **Responsive Design**: Mobile-first approach with cross-platform compatibility
- **Interactive Elements**: Smooth animations and dynamic content
- **AI Integration**: Direct integration with Cursor AI and OpenAI
- **Download System**: Advanced download management with analytics
- **Owner Dashboard**: Protected administrative access
- **Subscription System**: Monetization and payment processing
- **Multi-Language Support**: Ready for internationalization

## 🚀 Deployment Options

### Vercel Deployment (Recommended)

#### Prerequisites
- Node.js 18+ installed
- Vercel CLI installed (`npm install -g vercel`)
- GitHub repository connected

#### Quick Deploy
```bash
# Clone the repository
git clone https://github.com/LilToreyFTW/ShadowWatchAI.git
cd ShadowWatchAI/shadowwatch-website

# Install dependencies
npm install

# Deploy to Vercel
npm run deploy:vercel
# or
./deploy-vercel.sh  # Linux/macOS
# or
deploy-vercel.bat   # Windows
```

#### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### Local Development

#### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

#### Access
- **Website**: http://localhost:8080
- **AI Control**: http://localhost:8080/cursor-control.html
- **Documentation**: http://localhost:8080/documentation.html
- **Owner Login**: http://localhost:8080/owner-login

## 📁 Project Structure

```
shadowwatch-website/
├── api/                          # Vercel serverless functions
│   ├── cursor/                   # Cursor AI endpoints
│   ├── download/                 # Download management
│   ├── openai/                   # OpenAI integration
│   └── owner/                    # Owner authentication
├── download/                     # Downloadable files
├── owner-projects/              # Owner project management
├── server.js                     # Express server
├── vercel.json                   # Vercel configuration
├── package.json                  # Dependencies
├── index.html                    # Main website
├── styles.css                    # Moon-themed styling
├── script.js                     # Client-side functionality
├── cursor-control.html          # AI control interface
├── documentation.html           # Complete documentation
└── deploy-vercel.*              # Deployment scripts
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# Vercel Environment
VERCEL=1

# Session Configuration
SESSION_SECRET=your-secret-key-here

# API Keys (for full functionality)
CURSOR_API_KEY=your-cursor-api-key
OPENAI_API_KEY=your-openai-api-key

# CORS Configuration
CORS_ORIGIN=http://localhost:8080
```

### Vercel Configuration
The `vercel.json` file contains:
- Serverless function routing
- API endpoint configuration
- Build settings
- Security headers

## 🎨 Customization

### Theming
- **Colors**: Edit CSS custom properties in `styles.css`
- **Moon Effects**: Modify 3D transforms and animations
- **Typography**: Update font families and sizes

### Content
- **Navigation**: Update tabs in `index.html`
- **Features**: Modify feature cards and descriptions
- **Pricing**: Edit subscription plans and pricing

### Functionality
- **AI Integration**: Configure API endpoints in `server.js`
- **Download System**: Customize download options
- **Authentication**: Modify owner access credentials

## 🔐 Security Features

- **Owner Authentication**: Protected admin access
- **File Protection**: AI cannot modify its own code
- **Download Verification**: SHA256 integrity checking
- **Session Management**: Secure session handling
- **CORS Protection**: Configured cross-origin policies

## 📊 Analytics & Monitoring

### Download Analytics
- Real-time download tracking
- File integrity verification
- User behavior analytics
- Performance monitoring

### Vercel Analytics
- Serverless function metrics
- Response times and errors
- Geographic distribution
- Bandwidth usage

## 🐛 Troubleshooting

### Common Issues

#### Vercel Deployment Issues
```bash
# Check Vercel status
vercel --debug

# View deployment logs
vercel logs

# Redeploy
vercel --prod
```

#### Local Development Issues
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check port availability
lsof -i :8080

# Clear cache
npm cache clean --force
```

#### API Connection Issues
- Verify API keys in `.env`
- Check Vercel environment variables
- Review server logs for errors

## 🚀 Performance Optimization

### Vercel Optimizations
- Serverless function cold starts minimized
- Static assets cached globally
- API responses optimized
- CDN integration automatic

### Code Optimizations
- ES6 modules for tree shaking
- Compressed assets
- Lazy loading where applicable
- Efficient bundle splitting

## 📱 Mobile Responsiveness

- **Breakpoint System**: Mobile-first design
- **Touch Interactions**: Optimized for touch devices
- **Performance**: Lightweight animations
- **Accessibility**: WCAG compliant features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

### Documentation
- [Complete Documentation](documentation.html)
- [API Reference](api/)
- [Troubleshooting Guide](README-WINDOWS.md)

### Community
- [GitHub Issues](https://github.com/LilToreyFTW/ShadowWatchAI/issues)
- [Forum](https://forum.shadowwatch-ai.com)

### Contact
- **Email**: support@shadowwatch-ai.com
- **Owner**: owner@shadowwatch-ai.com

---

## 🌟 Acknowledgments

- **Cursor AI**: For providing the AI integration foundation
- **OpenAI**: For GPT model access
- **Vercel**: For serverless deployment platform
- **Node.js Community**: For the robust runtime environment

---

<div align="center">

**🚀 ShadowWatch AI - Deployed with Vercel**

*Ethical AI for gaming - Now live worldwide!*

[🌐 Live Website](https://shadowwatch-ai.vercel.app) • [📚 Documentation](documentation.html) • [📥 Download](download/)

</div>
