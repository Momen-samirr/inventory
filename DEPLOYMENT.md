# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Inventory Management System to production using Vercel (frontend), Render (backend), Neon (PostgreSQL), and Cloudinary (images).

## Prerequisites

- GitHub account with repository access
- Vercel account (free tier available)
- Render account (free tier available)
- Neon account (free tier available)
- Cloudinary account (free tier available)

## Deployment Architecture

```
[User Browser]
    ↓ HTTPS
[Vercel - Next.js Frontend]
    ↓ HTTPS API Calls
[Render - Express Backend]
    ↓ PostgreSQL Connection (SSL)
[Neon - PostgreSQL Database]
```

## Step 1: Set Up Neon Database

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up for a free account
   - Create a new project

2. **Get Connection String**
   - In your Neon dashboard, go to your project
   - Copy the connection string (it will look like: `postgresql://user:password@hostname.neon.tech/dbname?sslmode=require`)
   - **Important**: Neon connection strings already include SSL parameters

3. **Note the Connection String**
   - Save this for Step 2 (backend deployment)

## Step 2: Deploy Backend to Render

1. **Create Render Service**
   - Go to https://render.com
   - Sign in and click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing this project

2. **Configure Service Settings**
   - **Name**: `inventory-management-api` (or your preferred name)
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

3. **Set Environment Variables**
   Add the following environment variables in Render dashboard:
   
   ```
   NODE_ENV=production
   PORT=8000
   DATABASE_URL=<your-neon-connection-string>
   JWT_SECRET=<generate-strong-secret-32-chars-minimum>
   JWT_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   CLIENT_URL=<will-be-set-after-frontend-deployment>
   ```

   **Generating JWT_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

4. **Deploy Backend**
   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://inventory-management-api.onrender.com`)

5. **Run Database Migrations**
   - In Render dashboard, go to your service
   - Open the "Shell" tab
   - Run: `npm run migrate:deploy`
   - This will apply all database migrations to your Neon database

6. **Verify Backend**
   - Visit `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

## Step 3: Update Backend CORS

1. **Update CLIENT_URL in Render**
   - Go back to Render environment variables
   - Update `CLIENT_URL` with your Vercel frontend URL (from Step 4)
   - Or set it temporarily to `https://your-frontend.vercel.app` (update after frontend deployment)

## Step 4: Deploy Frontend to Vercel

1. **Create Vercel Project**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "Add New..." → "Project"
   - Import your GitHub repository

2. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

3. **Set Environment Variables**
   Add the following environment variables in Vercel dashboard:
   
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com/api
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   ```

4. **Deploy Frontend**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Wait for deployment to complete
   - Note your frontend URL (e.g., `https://your-app.vercel.app`)

5. **Update Backend CORS (if not done)**
   - Go back to Render environment variables
   - Update `CLIENT_URL` with your Vercel frontend URL
   - Render will automatically restart the service

## Step 5: Configure Cloudinary

1. **Create Cloudinary Account**
   - Go to https://cloudinary.com
   - Sign up for a free account
   - Get your credentials from the dashboard:
     - Cloud Name
     - API Key
     - API Secret

2. **Upload Default Images (Optional)**
   - Upload `logo.png` to Cloudinary root
   - Upload `profile.jpg` to Cloudinary root
   - Upload `product1.png`, `product2.png`, `product3.png` to a `products/` folder

3. **Set CORS (if needed)**
   - In Cloudinary dashboard, go to Settings → Security
   - Add your Vercel domain to allowed domains (if required)

## Step 6: Post-Deployment Verification

### Backend Verification

1. **Health Check**
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Test API Endpoint**
   ```bash
   curl https://your-backend-url.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@inventory.com","password":"admin123"}'
   ```

### Frontend Verification

1. **Visit Frontend URL**
   - Open `https://your-app.vercel.app` in browser
   - Should load the login page

2. **Test Login**
   - Use default admin credentials (change in production!)
   - Email: `admin@inventory.com`
   - Password: `admin123`

3. **Verify API Connection**
   - Check browser console for errors
   - Verify API calls are going to correct backend URL

### Database Verification

1. **Check Neon Dashboard**
   - Go to Neon dashboard
   - Verify tables were created
   - Check connection status

## Environment Variables Checklist

### Backend (Render)
- [ ] `NODE_ENV=production`
- [ ] `PORT=8000`
- [ ] `DATABASE_URL` (Neon connection string)
- [ ] `JWT_SECRET` (32+ characters, strong secret)
- [ ] `JWT_EXPIRES_IN=7d`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `CLIENT_URL` (Vercel frontend URL)

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_BASE_URL` (Render backend URL + `/api`)
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (optional)

## Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] Default admin password changed
- [ ] CORS configured for production URL only
- [ ] All environment variables set correctly
- [ ] Database connection uses SSL (Neon default)
- [ ] No secrets exposed in frontend code
- [ ] Rate limiting enabled (already configured)
- [ ] Security headers enabled (already configured)

## Troubleshooting

### Backend Issues

**Problem**: Backend fails to start
- **Solution**: Check Render logs for errors
- Verify all environment variables are set
- Check that DATABASE_URL is correct
- Ensure JWT_SECRET is set and valid

**Problem**: Database connection fails
- **Solution**: Verify DATABASE_URL includes SSL parameters
- Check Neon dashboard for connection status
- Ensure migrations ran successfully

**Problem**: CORS errors
- **Solution**: Verify CLIENT_URL matches your Vercel frontend URL exactly
- Check that CORS allows your frontend domain
- Clear browser cache

### Frontend Issues

**Problem**: Frontend can't connect to backend
- **Solution**: Verify NEXT_PUBLIC_API_BASE_URL is correct
- Check that backend is running and accessible
- Verify CORS is configured correctly

**Problem**: Images not loading
- **Solution**: Verify Cloudinary credentials are set
- Check that image URLs are correct
- Verify Cloudinary CORS settings

### Database Issues

**Problem**: Migrations fail
- **Solution**: Check DATABASE_URL format
- Verify database is accessible
- Check Neon dashboard for connection issues

## Production Best Practices

1. **Change Default Credentials**
   - Change admin email and password immediately
   - Use strong passwords for all users

2. **Monitor Logs**
   - Regularly check Render logs for errors
   - Monitor Vercel deployment logs
   - Set up error tracking (e.g., Sentry)

3. **Backup Database**
   - Neon provides automatic backups
   - Verify backup schedule in Neon dashboard
   - Consider manual backups for critical data

4. **Update Dependencies**
   - Regularly update npm packages
   - Monitor security advisories
   - Test updates in staging before production

5. **Scale Resources**
   - Monitor Render service usage
   - Upgrade to paid tier if needed (prevents spin-down)
   - Consider database connection pooling for high traffic

## Cost Estimate

- **Vercel**: Free tier (suitable for small/medium projects)
- **Render**: Free tier (may spin down after inactivity) or $7/month (always-on)
- **Neon**: Free tier (suitable for development/small projects) or $19/month (production)
- **Cloudinary**: Free tier (25 credits/month) or $89/month (paid)

**Total**: $0-115/month depending on tier

## Support

For deployment issues:
1. Check platform-specific documentation:
   - Vercel: https://vercel.com/docs
   - Render: https://render.com/docs
   - Neon: https://neon.tech/docs
   - Cloudinary: https://cloudinary.com/documentation

2. Review application logs in each platform's dashboard

3. Check GitHub issues for known problems

