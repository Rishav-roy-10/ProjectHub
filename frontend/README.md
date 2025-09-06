# AI Developer Project - Frontend

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Vercel Deployment Guide

### Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Git repository with your project

### Deployment Steps

#### 1. Push Your Code to GitHub

Make sure your project is pushed to a GitHub repository.

#### 2. Import Your Project in Vercel

1. Log in to your Vercel account
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the frontend directory as the root directory

#### 3. Configure Project Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### 4. Environment Variables

Add the following environment variables:

```
VITE_API_URL=https://projecthub-evy1.onrender.com
REACT_APP_API_URL=https://projecthub-evy1.onrender.com
```

#### 5. Deploy

Click "Deploy" and wait for the build to complete.

### Post-Deployment

- Your frontend will be accessible at the Vercel-provided URL
- The backend is already deployed at https://projecthub-evy1.onrender.com
- Test all functionality to ensure everything works correctly

### Troubleshooting

#### CORS Issues

If you encounter CORS issues, check the following:

1. Ensure your backend has proper CORS headers set up
2. Verify that the environment variables are correctly set in Vercel
3. Check that API requests are using the correct URL format

#### Build Failures

If your build fails on Vercel:

1. Check the build logs for specific errors
2. Ensure all dependencies are correctly listed in package.json
3. Verify that your Vite configuration is compatible with Vercel
4. Try running the build locally with `npm run build` to identify issues

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
