#!/usr/bin/env tsx
/**
 * Migration Script: JSON to PostgreSQL
 *
 * This script migrates all data from the JSON file database to PostgreSQL.
 *
 * Prerequisites:
 * 1. Set up PostgreSQL database
 * 2. Add DATABASE_URL to .env file
 * 3. Run: npx prisma migrate dev --name init
 * 4. Run this script: npx tsx scripts/migrate-json-to-postgres.ts
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Path to JSON database
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Helper function to convert status strings
function convertProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'in_progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'on_hold': 'ON_HOLD',
    'cancelled': 'CANCELLED',
  };
  return statusMap[status] || 'IN_PROGRESS';
}

function convertPropertyType(type: string): string {
  const typeMap: Record<string, string> = {
    'apartment': 'APARTMENT',
    'villa': 'VILLA',
    'shop': 'SHOP',
    'office': 'OFFICE',
    'land': 'LAND',
    'warehouse': 'WAREHOUSE',
  };
  return typeMap[type] || 'APARTMENT';
}

function convertPropertyStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'available': 'AVAILABLE',
    'rented': 'RENTED',
    'sold': 'SOLD',
    'under_maintenance': 'UNDER_MAINTENANCE',
  };
  return statusMap[status] || 'AVAILABLE';
}

function convertCustomerType(type: string): string {
  const typeMap: Record<string, string> = {
    'buyer': 'BUYER',
    'tenant': 'TENANT',
    'lead': 'LEAD',
    'owner': 'OWNER',
  };
  return typeMap[type] || 'LEAD';
}

function convertPaymentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'paid': 'PAID',
    'unpaid': 'UNPAID',
    'partially_paid': 'PARTIALLY_PAID',
    'overdue': 'OVERDUE',
  };
  return statusMap[status] || 'UNPAID';
}

function convertRole(role: string): string {
  const roleMap: Record<string, string> = {
    'admin': 'ADMIN',
    'manager': 'MANAGER',
    'user': 'USER',
  };
  return roleMap[role] || 'USER';
}

function convertPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    'cash': 'CASH',
    'bank_transfer': 'BANK_TRANSFER',
    'cheque': 'CHEQUE',
    'card': 'CARD',
  };
  return methodMap[method] || 'CASH';
}

function convertTransactionCategory(category: string): string {
  return category.toUpperCase();
}

async function migrate() {
  try {
    console.log('🚀 Starting migration from JSON to PostgreSQL...\n');

    // Check if JSON file exists
    if (!fs.existsSync(DB_PATH)) {
      console.error(`❌ JSON database file not found at: ${DB_PATH}`);
      console.log('   Creating empty database...');
      return;
    }

    // Read JSON data
    const jsonData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    console.log('📖 Read JSON database successfully\n');

    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await prisma.transaction.deleteMany();
    await prisma.receipt.deleteMany();
    await prisma.contract.deleteMany();
    await prisma.rentalContract.deleteMany();
    await prisma.saleContract.deleteMany();
    await prisma.document.deleteMany();
    await prisma.rental.deleteMany();
    await prisma.property.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleared existing data\n');

    // 1. Migrate Users
    console.log('👥 Migrating users...');
    let userCount = 0;
    for (const user of jsonData.users || []) {
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: convertRole(user.role),
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
      userCount++;
    }
    console.log(`   ✅ Migrated ${userCount} users\n`);

    // 2. Migrate Projects
    console.log('📁 Migrating projects...');
    let projectCount = 0;
    for (const project of jsonData.projects || []) {
      await prisma.project.create({
        data: {
          id: project.id,
          projectId: project.projectId || `PRJ-${String(projectCount + 1).padStart(4, '0')}`,
          name: project.name,
          description: project.description || '',
          budget: project.budget,
          spent: project.spent || 0,
          completion: project.completion || 0,
          status: convertProjectStatus(project.status),
          startDate: new Date(project.startDate),
          endDate: new Date(project.endDate),
          costs: project.costs || { materials: 0, labor: 0, overhead: 0 },
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        },
      });
      projectCount++;
    }
    console.log(`   ✅ Migrated ${projectCount} projects\n`);

    // 3. Migrate Customers
    console.log('👤 Migrating customers...');
    let customerCount = 0;
    for (const customer of jsonData.customers || []) {
      await prisma.customer.create({
        data: {
          id: customer.id,
          customerId: customer.customerId || `CUS-${String(customerCount + 1).padStart(4, '0')}`,
          name: customer.name,
          type: convertCustomerType(customer.type),
          email: customer.email || null,
          phone: customer.phone,
          alternatePhone: customer.alternatePhone || null,
          address: customer.address,
          emiratesId: customer.emiratesId || null,
          passportNo: customer.passportNo || null,
          nationality: customer.nationality || null,
          notes: customer.notes || null,
          assignedPropertyIds: customer.assignedPropertyIds || [],
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt),
        },
      });
      customerCount++;
    }
    console.log(`   ✅ Migrated ${customerCount} customers\n`);

    // 4. Migrate Properties
    console.log('🏠 Migrating properties...');
    let propertyCount = 0;
    for (const property of jsonData.properties || []) {
      await prisma.property.create({
        data: {
          id: property.id,
          propertyId: property.propertyId || `PRP-${String(propertyCount + 1).padStart(4, '0')}`,
          name: property.name,
          type: convertPropertyType(property.type),
          status: convertPropertyStatus(property.status),
          price: property.price,
          rentalPrice: property.rentalPrice || null,
          area: property.area,
          bedrooms: property.bedrooms || null,
          bathrooms: property.bathrooms || null,
          location: property.location,
          address: property.address,
          description: property.description || '',
          features: property.features || [],
          images: property.images || [],
          saleInfo: property.saleInfo || null,
          projectId: property.projectId || null,
          ownerId: property.ownerId || null,
          createdAt: new Date(property.createdAt),
          updatedAt: new Date(property.updatedAt),
        },
      });
      propertyCount++;
    }
    console.log(`   ✅ Migrated ${propertyCount} properties\n`);

    // 5. Migrate Rentals
    console.log('📋 Migrating rentals...');
    let rentalCount = 0;
    for (const rental of jsonData.rentals || []) {
      await prisma.rental.create({
        data: {
          id: rental.id,
          rentalId: rental.rentalId || `RNT-${String(rentalCount + 1).padStart(4, '0')}`,
          propertyId: rental.propertyId,
          tenantId: rental.tenantId,
          monthlyRent: rental.monthlyRent,
          depositAmount: rental.depositAmount,
          leaseStart: new Date(rental.leaseStart),
          leaseEnd: new Date(rental.leaseEnd),
          dueDay: rental.dueDay,
          paymentStatus: convertPaymentStatus(rental.paymentStatus),
          paidUntil: new Date(rental.paidUntil),
          notes: rental.notes || null,
          createdAt: new Date(rental.createdAt),
          updatedAt: new Date(rental.updatedAt),
        },
      });
      rentalCount++;
    }
    console.log(`   ✅ Migrated ${rentalCount} rentals\n`);

    // 6. Migrate Receipts
    console.log('🧾 Migrating receipts...');
    let receiptCount = 0;
    for (const receipt of jsonData.receipts || []) {
      await prisma.receipt.create({
        data: {
          id: receipt.id,
          receiptNo: receipt.receiptNo || `RCP-${String(receiptCount + 1).padStart(4, '0')}`,
          type: receipt.type,
          amount: receipt.amount,
          paidBy: receipt.paidBy,
          customerId: receipt.customerId || null,
          propertyId: receipt.propertyId || null,
          projectId: receipt.projectId || null,
          rentalId: receipt.rentalId || null,
          paymentMethod: convertPaymentMethod(receipt.paymentMethod),
          reference: receipt.reference || null,
          description: receipt.description,
          date: new Date(receipt.date),
          createdAt: new Date(receipt.createdAt),
        },
      });
      receiptCount++;
    }
    console.log(`   ✅ Migrated ${receiptCount} receipts\n`);

    // 7. Migrate Transactions
    console.log('💰 Migrating transactions...');
    let transactionCount = 0;
    for (const transaction of jsonData.transactions || []) {
      await prisma.transaction.create({
        data: {
          id: transaction.id,
          transactionNo: transaction.transactionNo || `TPL-${String(transactionCount + 1).padStart(4, '0')}`,
          projectId: transaction.projectId,
          propertyId: transaction.propertyId,
          customerId: transaction.customerId,
          category: convertTransactionCategory(transaction.category),
          type: transaction.type,
          amount: transaction.amount,
          paidBy: transaction.paidBy,
          paymentMethod: convertPaymentMethod(transaction.paymentMethod),
          isSaleTransaction: transaction.isSaleTransaction || false,
          saleDetails: transaction.saleDetails || null,
          rentalId: transaction.rentalId || null,
          reference: transaction.reference || null,
          description: transaction.description,
          date: new Date(transaction.date),
          createdAt: new Date(transaction.createdAt),
          updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt) : null,
        },
      });
      transactionCount++;
    }
    console.log(`   ✅ Migrated ${transactionCount} transactions\n`);

    // 8. Migrate Contracts (legacy format)
    console.log('📄 Migrating contracts...');
    let contractCount = 0;
    for (const contract of jsonData.contracts || []) {
      await prisma.contract.create({
        data: {
          id: contract.id,
          contractNo: contract.contractNo || `CNT-${String(contractCount + 1).padStart(4, '0')}`,
          type: contract.type?.toUpperCase() === 'SALE' ? 'SALE' : 'RENTAL',
          status: contract.status?.toUpperCase() || 'DRAFT',
          propertyId: contract.propertyId,
          customerId: contract.customerId,
          amount: contract.amount,
          startDate: new Date(contract.startDate),
          endDate: new Date(contract.endDate),
          signatureDate: contract.signatureDate ? new Date(contract.signatureDate) : null,
          terms: contract.terms,
          documentUrl: contract.documentUrl || null,
          createdAt: new Date(contract.createdAt),
          updatedAt: new Date(contract.updatedAt),
        },
      });
      contractCount++;
    }
    console.log(`   ✅ Migrated ${contractCount} contracts\n`);

    // 9. Migrate Rental Contracts
    console.log('📝 Migrating rental contracts...');
    let rentalContractCount = 0;
    for (const rc of jsonData.rentalContracts || []) {
      await prisma.rentalContract.create({
        data: {
          id: rc.id,
          contractNumber: rc.contractNumber,
          type: 'RENTAL',
          status: rc.status?.toUpperCase() || 'DRAFT',
          landlordName: rc.landlordName,
          landlordCR: rc.landlordCR,
          landlordPOBox: rc.landlordPOBox,
          landlordPostalCode: rc.landlordPostalCode,
          landlordAddress: rc.landlordAddress,
          tenantName: rc.tenantName,
          tenantIdPassport: rc.tenantIdPassport,
          tenantLabourCard: rc.tenantLabourCard || null,
          tenantPhone: rc.tenantPhone,
          tenantEmail: rc.tenantEmail,
          tenantSponsor: rc.tenantSponsor || null,
          tenantCR: rc.tenantCR || null,
          validFrom: new Date(rc.validFrom),
          validTo: new Date(rc.validTo),
          agreementPeriod: rc.agreementPeriod,
          monthlyRent: rc.monthlyRent,
          paymentFrequency: rc.paymentFrequency?.toUpperCase() || 'MONTHLY',
          landlordSignature: rc.landlordSignature,
          landlordSignDate: new Date(rc.landlordSignDate),
          tenantSignature: rc.tenantSignature,
          tenantSignDate: new Date(rc.tenantSignDate),
          pdfUrl: rc.pdfUrl || null,
          createdAt: new Date(rc.createdAt),
          updatedAt: new Date(rc.updatedAt),
        },
      });
      rentalContractCount++;
    }
    console.log(`   ✅ Migrated ${rentalContractCount} rental contracts\n`);

    // 10. Migrate Documents
    console.log('📎 Migrating documents...');
    let documentCount = 0;
    for (const doc of jsonData.documents || []) {
      await prisma.document.create({
        data: {
          id: doc.id,
          name: doc.name,
          category: doc.category?.toUpperCase() || 'OTHER',
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          fileUrl: doc.fileUrl,
          relatedType: doc.relatedTo?.type || null,
          relatedId: doc.relatedTo?.id || null,
          propertyId: doc.relatedTo?.type === 'property' ? doc.relatedTo.id : null,
          uploadDate: new Date(doc.uploadDate),
          createdAt: new Date(doc.createdAt),
        },
      });
      documentCount++;
    }
    console.log(`   ✅ Migrated ${documentCount} documents\n`);

    console.log('✨ Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Projects: ${projectCount}`);
    console.log(`   - Customers: ${customerCount}`);
    console.log(`   - Properties: ${propertyCount}`);
    console.log(`   - Rentals: ${rentalCount}`);
    console.log(`   - Receipts: ${receiptCount}`);
    console.log(`   - Transactions: ${transactionCount}`);
    console.log(`   - Contracts: ${contractCount}`);
    console.log(`   - Rental Contracts: ${rentalContractCount}`);
    console.log(`   - Documents: ${documentCount}`);
    console.log(`   TOTAL: ${userCount + projectCount + customerCount + propertyCount + rentalCount + receiptCount + transactionCount + contractCount + rentalContractCount + documentCount} records\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
