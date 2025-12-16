# Demo Setup Guide

This document explains how the GitHub Pages demo is set up for the React Object View project.

## 🌐 Live Demo

The demo is automatically deployed to: **https://vothanhdat.github.io/react-obj-view/**

## 🏗️ Build Setup

### Scripts

- `yarn build:demo` - Build demo for production
- `yarn preview:demo` - Preview demo locally after build
- `yarn dev` - Development server with hot reload

### Configuration

The demo uses a separate Vite configuration (`vite.config.demo.ts`) with:

- **Base URL**: `/react-obj-view/` (GitHub Pages repository name)
- **Output Directory**: `demo-dist/`
- **Target**: ES2020 for modern browsers
- **Production optimizations**: Minification, tree shaking

### File Structure

```
├── index.html              # Demo page template
├── src/
│   ├── dev.tsx             # Demo entry point
│   ├── Test.tsx            # Main demo component
│   ├── Test.css            # Demo-specific styles
│   └── ...
├── public/
│   └── favicon.svg         # Demo favicon
├── vite.config.demo.ts     # Demo build configuration
└── .github/workflows/
    └── deploy-demo.yml     # Auto-deployment workflow
```

## 🚀 Deployment

### Automatic Deployment

The demo is automatically deployed via GitHub Actions when:

- Code is pushed to the `master` branch
- Manual workflow dispatch is triggered

### Manual Deployment

1. **Build the demo**:
   ```bash
   yarn build:demo
   ```

2. **Test locally** (optional):
   ```bash
   yarn preview:demo
   ```

3. **Commit and push**:
   ```bash
   git add .
   git commit -m "Update demo"
   git push origin master
   ```

4. **GitHub Actions** will automatically build and deploy to GitHub Pages

## 🔧 GitHub Pages Configuration

### Repository Settings

1. Go to **Settings** → **Pages**
2. Set **Source** to "GitHub Actions"
3. The workflow will handle the deployment

### Custom Domain (Optional)

To use a custom domain:

1. Add `CNAME` file to the repository root
2. Configure DNS settings
3. Update the `base` URL in `vite.config.demo.ts`

## 📝 Demo Features

The demo showcases:

- ✅ **Interactive Controls**: Toggle features and adjust settings
- ✅ **Virtualized Tree**: Smooth scrolling backed by the built-in `VirtualScroller`
- ✅ **Resolver Overrides**: User, API endpoint, and class-based resolver examples
- ✅ **Floating Search**: Keyboard shortcuts, debounced input, streamed results, and inline highlights
- ✅ **Keyword Styling**: Enhanced boolean and null value display
- ✅ **Performance Options**: Grouping, iteration sizing, and highlighting controls
- ✅ **Theme Picker**: Switch across dark/light palettes (including GitHub Light, Quiet Light, Solarized Light, Sepia, and General)
- ✅ **Live Data**: Telemetry-style stream, typed-array heavy payloads, and megabyte-scale cases
- ✅ **Real-time Updates**: See changes instantly
- ✅ **Multiple Data Types**: Comprehensive examples
- ✅ **Professional UI**: Header, footer, and documentation links

## 🎨 Customization

### Styling

- Modify `src/Test.css` for demo-specific styles
- Update `src/style.css` for component styles
- Customize colors and layout in `src/Test.tsx`
- Extend the `themeOptions` array in `src/Test.tsx` to surface additional palettes in the picker

### Data Examples

- Add new examples in `src/exampleData/`
- Extend resolver demos in `src/Test.tsx`
- Update dropdown options in the `testDataOptions` array

### Branding

- Update favicon in `public/favicon.svg`
- Modify meta tags in `index.html`
- Customize header and footer in `src/Test.tsx`

## 🔍 Monitoring

### Analytics (Optional)

Add analytics to track demo usage:

```html
<!-- Add to index.html head -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

### Performance

Monitor build performance and bundle size:

- Vite includes bundle analyzer
- Check build logs for optimization opportunities
- Monitor demo loading speed

## 🐛 Troubleshooting

### Build Failures

1. **Check dependencies**: Ensure all packages are installed
2. **TypeScript errors**: Fix any type issues
3. **Import paths**: Verify all imports are correct
4. **Base URL**: Ensure GitHub Pages base URL is correct

### Deployment Issues

1. **GitHub Actions**: Check workflow logs
2. **Permissions**: Verify repository has Pages enabled
3. **Branch protection**: Ensure workflow can push to Pages

### Local Development

1. **Port conflicts**: Demo dev server uses different ports
2. **Cache issues**: Clear browser cache and node_modules
3. **TypeScript**: Restart TS server if needed

## 📚 Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)