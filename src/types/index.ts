// Types for the Real Estate Management System

// ============ Project Types ============
export interface Project {
    id: string;
    name: string;
    description: string;
    budget: number;
    spent: number;
    completion: number;
    status: "in_progress" | "completed" | "on_hold" | "cancelled";
    startDate: string;
    endDate: string;
    costs: {
        materials: number;
        labor: number;
        overhead: number;
    };
    createdAt: string;
    updatedAt: string;
}

// ============ Property Types ============
export type PropertyType = "apartment" | "villa" | "shop" | "office" | "land" | "warehouse";
export type PropertyStatus = "available" | "rented" | "sold" | "under_maintenance";

export interface Property {
    id: string;
    name: string;
    type: PropertyType;
    status: PropertyStatus;
    price: number;
    rentalPrice?: number;
    area: number;
    bedrooms?: number;
    bathrooms?: number;
    location: string;
    address: string;
    description: string;
    features: string[];
    images: string[];
    projectId?: string;
    ownerId?: string;
    createdAt: string;
    updatedAt: string;
}

// ============ Customer Types ============
export type CustomerType = "buyer" | "tenant" | "lead" | "owner";

export interface Customer {
    id: string;
    name: string;
    type: CustomerType;
    email: string;
    phone: string;
    alternatePhone?: string;
    address: string;
    emiratesId?: string;
    passportNo?: string;
    nationality?: string;
    notes: string;
    assignedPropertyIds: string[];
    createdAt: string;
    updatedAt: string;
}

// ============ Rental Types ============
export type PaymentStatus = "paid" | "unpaid" | "partially_paid" | "overdue";

export interface Rental {
    id: string;
    propertyId: string;
    property?: Property;
    tenantId: string;
    tenant?: Customer;
    monthlyRent: number;
    depositAmount: number;
    leaseStart: string;
    leaseEnd: string;
    dueDay: number;
    paymentStatus: PaymentStatus;
    paidUntil: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface RentalPayment {
    id: string;
    rentalId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: "cash" | "bank_transfer" | "cheque" | "card";
    reference?: string;
    notes?: string;
    createdAt: string;
}

// ============ Receipt Types ============
export type ReceiptType = "rent" | "deposit" | "maintenance" | "other";
export type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "card";

export interface Receipt {
    id: string;
    receiptNo: string;
    type: ReceiptType;
    amount: number;
    paidBy: string;
    customerId?: string;
    propertyId?: string;
    rentalId?: string;
    paymentMethod: PaymentMethod;
    reference?: string;
    description: string;
    date: string;
    createdAt: string;
}

// ============ Contract Types ============
export type ContractType = "sale" | "rental";
export type ContractStatus = "draft" | "signed" | "expired" | "cancelled";
export type PaymentFrequency = "monthly" | "quarterly" | "yearly";

export interface Contract {
    id: string;
    contractNo: string;
    type: ContractType;
    status: ContractStatus;
    propertyId: string;
    property?: Property;
    customerId: string;
    customer?: Customer;
    amount: number;
    startDate: string;
    endDate: string;
    signatureDate?: string;
    terms: string;
    documentUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// Rental Contract with full details for PDF generation
export interface RentalContract {
    id: string;
    contractNumber: string; // Auto: "RC-YYYYMMDD-XXX"
    type: ContractType;
    status: ContractStatus;

    // Landlord (First Party)
    landlordName: string;
    landlordCR: string;
    landlordPOBox: string;
    landlordPostalCode: string;
    landlordAddress: string;

    // Tenant (Second Party)
    tenantName: string;
    tenantIdPassport: string;
    tenantLabourCard?: string;
    tenantPhone: string;
    tenantEmail: string;
    tenantSponsor?: string;
    tenantCR?: string;

    // Contract Terms
    validFrom: string;
    validTo: string;
    agreementPeriod: string; // e.g., "1 year", "6 months"
    monthlyRent: number;
    paymentFrequency: PaymentFrequency;

    // Signatures (typed names)
    landlordSignature: string;
    landlordSignDate: string;
    tenantSignature: string;
    tenantSignDate: string;

    // Meta
    pdfUrl?: string;
    createdAt: string;
    updatedAt: string;
}

// ============ Document Types ============
export type DocumentCategory = "contracts" | "receipts" | "identities" | "property" | "other";

export interface Document {
    id: string;
    name: string;
    category: DocumentCategory;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    relatedTo?: {
        type: "property" | "customer" | "rental" | "contract";
        id: string;
    };
    uploadDate: string;
    createdAt: string;
}

// ============ Dashboard Types ============
export interface DashboardStats {
    totalProperties: number;
    propertiesChange: number;
    totalRevenue: number;
    revenueChange: number;
    activeCustomers: number;
    customersChange: number;
    monthlyRevenue: number;
    monthlyRevenueChange: number;
    occupancyRate: number;
    pendingPayments: number;
}

export interface ChartData {
    name: string;
    value: number;
    [key: string]: string | number;
}

export interface Activity {
    id: string;
    type: "payment" | "contract" | "rental" | "property" | "customer";
    message: string;
    timestamp: string;
}

// ============ UI Types ============
export interface TableColumn<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export interface ToastMessage {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration?: number;
}

// ============ API Types ============
export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FilterParams {
    search?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}
