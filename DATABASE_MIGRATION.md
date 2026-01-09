# Database Migration Guide: JSON → PostgreSQL

This guide will help you migrate from the JSON file database to PostgreSQL with Prisma.

## Prerequisites

1. **PostgreSQL Database** - Choose one option:
   - **Local PostgreSQL** (for development)
   - **Supabase** (recommended - free tier available)
   - **Neon** (serverless PostgreSQL - free tier)
   - **Vercel Postgres** (if deploying to Vercel)
   - **Railway** (simple deployment)

## Option 1: Local PostgreSQL (Development)

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Create Database

```bash
# Access PostgreSQL
psql postgres

# Create database
CREATE DATABASE telalalbedaya;

# Create user (optional)
CREATE USER telalalbedaya_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE telalalbedaya TO telalalbedaya_user;

# Exit
\q
```

### Update .env

```bash
cp .env.example .env
```

Edit `.env` and set:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/telalalbedaya?schema=public"
```

## Option 2: Supabase (Recommended for Production)

1. Go to https://supabase.com and create account
2. Create new project
3. Wait for database to initialize (~2 minutes)
4. Go to Settings → Database → Connection String
5. Copy the "URI" connection string
6. Update `.env`:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

## Option 3: Neon (Serverless PostgreSQL)

1. Go to https://neon.tech and create account
2. Create new project
3. Copy connection string
4. Update `.env`:
```
DATABASE_URL="postgresql://[user]:[password]@[endpoint-id].neon.tech/[dbname]"
```

## Option 4: Vercel Postgres

1. In Vercel dashboard, go to Storage tab
2. Create PostgreSQL database
3. Vercel automatically sets `DATABASE_URL` in production
4. For local development, copy connection string from Vercel dashboard

---

## Migration Steps

### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

This creates the TypeScript types and Prisma Client based on your schema.

### Step 2: Create Database Schema

```bash
npx prisma db push
```

This creates all tables in your PostgreSQL database based on `prisma/schema.prisma`.

**Note:** For production, use migrations instead:
```bash
npx prisma migrate dev --name init
```

### Step 3: Backup Your JSON Data

```bash
cp data/db.json data/db.backup.json
```

### Step 4: Run Migration Script

```bash
npx tsx scripts/migrate-json-to-postgres.ts
```

This will:
- Read all data from `data/db.json`
- Transfer it to PostgreSQL
- Show progress for each table
- Display summary at the end

### Step 5: Verify Migration

Open Prisma Studio to browse your data:
```bash
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can:
- View all tables
- Check record counts
- Verify data integrity
- Browse relationships

### Step 6: Test the Application

```bash
npm run dev
```

Visit http://localhost:3000 and test:
- Login with existing user
- View customers, properties, rentals
- Create new records
- Update existing records
- Delete records

---

## Troubleshooting

### Error: "Can't reach database server"

**Check:**
1. Database is running
2. DATABASE_URL is correct
3. Firewall allows connections
4. For cloud databases, check IP whitelist

**Solution:**
```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Error: "Environment variable not found: DATABASE_URL"

**Solution:**
```bash
# Make sure .env file exists
cp .env.example .env

# Edit .env and add your DATABASE_URL
```

### Error: "Unique constraint failed"

**This means:**
- Data already exists in database
- Migration was run twice

**Solution:**
```bash
# Clear database and re-run
npx prisma db push --force-reset
npx tsx scripts/migrate-json-to-postgres.ts
```

### Error: "Foreign key constraint failed"

**This means:**
- Referenced record doesn't exist (e.g., property has invalid projectId)

**Solution:**
1. Check JSON data for invalid IDs
2. Fix or remove invalid relationships
3. Re-run migration

---

## Post-Migration

### Keep JSON as Backup (Optional)

Rename the old database file:
```bash
mv src/lib/db.ts src/lib/db.json.backup.ts
```

### Update package.json Scripts

Add helpful scripts:
```json
{
  "scripts": {
    "db:studio": "prisma studio",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:backup": "pg_dump $DATABASE_URL > backup.sql"
  }
}
```

### Set Up Automated Backups

**For Supabase:**
- Automatic backups included (7 day retention on free tier)

**For self-hosted:**
```bash
# Add to crontab (daily backup at 2 AM)
0 2 * * * pg_dump postgresql://user:pass@localhost:5432/dbname > /backups/db-$(date +\%Y\%m\%d).sql
```

---

## Performance Optimization

### After Migration, Add Indexes

Indexes are already included in the schema, but you can add more:

```prisma
// In prisma/schema.prisma
model Customer {
  // ... fields
  @@index([name])  // Add index for name searches
  @@fulltext([name, address])  // Full-text search (PostgreSQL only)
}
```

Then run:
```bash
npx prisma db push
```

### Query Optimization

Monitor slow queries:
```typescript
// In src/lib/prisma.ts
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],  // Log all queries
});
```

---

## Rollback Plan

If you need to rollback to JSON:

1. Keep the old `src/lib/db.ts` file
2. Restore from backup: `cp data/db.backup.json data/db.json`
3. Revert API routes to use JSON functions
4. Remove Prisma imports

---

## Benefits After Migration

✅ **100x faster queries** with indexes
✅ **No more race conditions** with concurrent writes
✅ **Data integrity** with foreign keys
✅ **ACID compliance** for financial transactions
✅ **Type safety** with Prisma Client
✅ **Scalable** to millions of records
✅ **Automated backups** (cloud providers)
✅ **Better security** with database-level permissions

---

## Next Steps

1. ✅ Complete migration
2. ✅ Test all features
3. ✅ Set up automated backups
4. ✅ Monitor query performance
5. ✅ Deploy to production
6. Consider adding:
   - Full-text search
   - Real-time subscriptions (with Supabase)
   - Read replicas for scaling
   - Connection pooling (PgBouncer)

---

## Support

- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Supabase Docs**: https://supabase.com/docs
- **Neon Docs**: https://neon.tech/docs

---

## Migration Checklist

- [ ] Choose database provider
- [ ] Create PostgreSQL database
- [ ] Update .env with DATABASE_URL
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`
- [ ] Backup JSON data
- [ ] Run migration script
- [ ] Verify in Prisma Studio
- [ ] Test application
- [ ] Update all API routes (in progress)
- [ ] Deploy to production
- [ ] Set up automated backups
