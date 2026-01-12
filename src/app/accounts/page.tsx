"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Textarea, Select, Badge, useToast, Tabs, SearchableSelect } from "@/components/ui";
import type { Transaction, Customer, Property, Project, TransactionCategory, TransactionType, Rental } from "@/types";
import { Plus, Download, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionWithDetails extends Transaction {
    customer?: Customer;
    property?: Property;
    project?: Project;
}

const incomeTypes = [
    { value: "rent_payment", label: "Rent Payment" },
    { value: "sale_payment", label: "Sale Payment" },
    { value: "deposit", label: "Deposit" },
    { value: "deposit_refund", label: "Deposit Refund" },
    { value: "other_income", label: "Other Income" },
];

const expenseTypes = [
    { value: "land_purchase", label: "Land Purchase" },
    { value: "maintenance", label: "Maintenance" },
    { value: "legal_fees", label: "Legal Fees" },
    { value: "commission", label: "Commission" },
    { value: "utilities", label: "Utilities" },
    { value: "taxes", label: "Taxes" },
    { value: "insurance", label: "Insurance" },
    { value: "other_expense", label: "Other Expense" },
];

export default function AccountsPage() {
    const { t } = useTranslation();
    const toast = useToast();

    const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithDetails | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("all");

    const [formData, setFormData] = useState({
        category: "income" as TransactionCategory,
        type: "rent_payment" as TransactionType,
        amount: "",
        paidBy: "",
        customerId: "",
        propertyId: "",
        projectId: "",
        rentalId: "",
        paymentMethod: "cash",
        reference: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        // Sale specific
        isSaleTransaction: false,
        totalSalePrice: "",
        paymentTerms: "lump_sum",
    });
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [transactionsRes, customersRes, propertiesRes, projectsRes, rentalsRes] = await Promise.all([
                fetch("/api/transactions"),
                fetch("/api/customers"),
                fetch("/api/properties"),
                fetch("/api/projects"),
                fetch("/api/rentals"),
            ]);

            if (transactionsRes.ok) {
                const data = await transactionsRes.json();
                setTransactions(data);
            }
            if (customersRes.ok) {
                const data = await customersRes.json();
                setCustomers(data);
            }
            if (propertiesRes.ok) {
                const data = await propertiesRes.json();
                setProperties(data);
            }
            if (projectsRes.ok) {
                const data = await projectsRes.json();
                setProjects(data);
            }
            if (rentalsRes.ok) {
                const data = await rentalsRes.json();
                setRentals(data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter transactions based on active tab
    const filteredTransactions = transactions.filter(t => {
        if (activeTab === "all") return true;
        if (activeTab === "income") return t.category === "income";
        if (activeTab === "expenses") return t.category === "expense";
        if (activeTab === "sales") return t.type === "sale_payment";
        return true;
    });

    const tabs = [
        { id: "all", label: t("common.all"), count: transactions.length },
        { id: "income", label: "Income", count: transactions.filter(t => t.category === "income").length },
        { id: "expenses", label: "Expenses", count: transactions.filter(t => t.category === "expense").length },
        { id: "sales", label: "Sales", count: transactions.filter(t => t.type === "sale_payment").length },
    ];

    const columns: Column<TransactionWithDetails>[] = [
        { key: "transactionNo", label: "No.", sortable: true },
        {
            key: "category",
            label: "Category",
            render: (item) => (
                <Badge variant={item.category === "income" ? "success" : "danger"}>
                    {item.category === "income" ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {item.category === "income" ? "Income" : "Expense"}
                </Badge>
            ),
        },
        {
            key: "type",
            label: t("common.type"),
            render: (item) => {
                const typeLabel = [...incomeTypes, ...expenseTypes].find(t => t.value === item.type)?.label || item.type;
                return <span className="capitalize">{typeLabel}</span>;
            },
        },
        {
            key: "propertyId",
            label: t("properties.title"),
            render: (item) => item.property?.name || "-",
        },
        {
            key: "customerId",
            label: t("customers.title"),
            render: (item) => item.customer?.name || "-",
        },
        {
            key: "amount",
            label: t("common.amount"),
            sortable: true,
            render: (item) => (
                <span className={item.category === "income" ? "text-success font-medium" : "text-destructive font-medium"}>
                    {item.category === "income" ? "+" : "-"}{formatCurrency(item.amount)}
                </span>
            ),
        },
        {
            key: "date",
            label: t("common.date"),
            sortable: true,
            render: (item) => formatDate(item.date),
        },
    ];

    const handleOpenModal = () => {
        setFormData({
            category: "income",
            type: "rent_payment",
            amount: "",
            paidBy: "",
            customerId: "",
            propertyId: "",
            projectId: "",
            rentalId: "",
            paymentMethod: "cash",
            reference: "",
            description: "",
            date: new Date().toISOString().split("T")[0],
            isSaleTransaction: false,
            totalSalePrice: "",
            paymentTerms: "lump_sum",
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        // Validation
        const errors: Record<string, boolean> = {};
        if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = true;
        if (formData.category === "income" && !formData.customerId) errors.customerId = true;
        if (formData.category === "expense" && !formData.paidBy.trim()) errors.paidBy = true;
        if (!formData.propertyId) errors.propertyId = true;
        if (!formData.projectId) errors.projectId = true;
        if (!formData.date) errors.date = true;
        if (formData.type === "sale_payment" && !formData.totalSalePrice) errors.totalSalePrice = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const payload: Partial<Transaction> = {
                category: formData.category,
                type: formData.type,
                amount: parseFloat(formData.amount),
                paidBy: formData.category === "income"
                    ? (customers.find(c => c.id === formData.customerId)?.name || formData.paidBy)
                    : formData.paidBy,
                customerId: formData.category === "income" ? formData.customerId : undefined,
                propertyId: formData.propertyId,
                projectId: formData.projectId,
                rentalId: formData.type === "rent_payment" ? formData.rentalId : undefined,
                paymentMethod: formData.paymentMethod as Transaction["paymentMethod"],
                reference: formData.reference || undefined,
                description: formData.description,
                date: formData.date,
            };

            // Add sale details if it's a sale transaction
            if (formData.type === "sale_payment") {
                payload.isSaleTransaction = true;
                payload.saleDetails = {
                    totalPrice: parseFloat(formData.totalSalePrice),
                    paidAmount: parseFloat(formData.amount),
                    remainingAmount: parseFloat(formData.totalSalePrice) - parseFloat(formData.amount),
                    paymentTerms: formData.paymentTerms as "lump_sum" | "monthly" | "quarterly" | "custom",
                };
            }

            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const newTransaction = await response.json();
                toast.success(`Transaction created: ${newTransaction.transactionNo}`);
                setIsModalOpen(false);
                fetchData();
            } else {
                const err = await response.json();
                toast.error(err.error || "Failed to create transaction");
            }
        } catch (error) {
            console.error("Error creating transaction:", error);
            toast.error("Failed to create transaction");
        }
    };

    const handleDelete = async (transaction: TransactionWithDetails) => {
        if (!confirm(`Delete transaction "${transaction.transactionNo}"?`)) return;

        try {
            const response = await fetch(`/api/transactions/${transaction.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Transaction deleted");
                fetchData();
            } else {
                toast.error("Failed to delete transaction");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            toast.error("Failed to delete transaction");
        }
    };

    const handleView = (transaction: TransactionWithDetails) => {
        setSelectedTransaction(transaction);
        setIsViewModalOpen(true);
    };

    const handleDownloadPdf = async (transaction: TransactionWithDetails) => {
        setDownloadingPdf(transaction.id);
        toast.info("Generating PDF...");
        try {
            const response = await fetch("/api/generate-receipt-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receipt: transaction }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `transaction-${transaction.transactionNo}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success("PDF downloaded");
            } else {
                toast.error("Failed to generate PDF");
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
            toast.error("Failed to download PDF");
        } finally {
            setDownloadingPdf(null);
        }
    };

    const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
    const propertyOptions = properties.map(p => ({ value: p.id, label: p.name }));
    const projectOptions = projects.map(p => ({ value: p.id, label: p.name }));

    const currentTypeOptions = formData.category === "income" ? incomeTypes : expenseTypes;

    return (
        <PageContainer
            title={t("nav.accounts")}
            actions={
                <Button onClick={handleOpenModal}>
                    <Plus size={18} />
                    Add Transaction
                </Button>
            }
        >
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-4">
                <DataTable
                    data={filteredTransactions}
                    columns={columns}
                    keyField="id"
                    loading={loading}
                    loadingLabel="Loading transactions..."
                    onDelete={handleDelete}
                    actions={(item) => (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleView(item)}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                title="View"
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                onClick={() => handleDownloadPdf(item)}
                                disabled={downloadingPdf === item.id}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                                title="Download PDF"
                            >
                                <Download size={16} className={downloadingPdf === item.id ? "animate-pulse" : ""} />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Create Transaction Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add Transaction"
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSubmit}>Save Transaction</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Category Toggle */}
                    <div className="flex gap-2 p-1 bg-muted rounded">
                        <button
                            onClick={() => setFormData({ ...formData, category: "income", type: "rent_payment" })}
                            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors rounded ${formData.category === "income"
                                ? "bg-success text-success-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <TrendingUp size={16} className="inline mr-2" />
                            Income
                        </button>
                        <button
                            onClick={() => setFormData({ ...formData, category: "expense", type: "maintenance" })}
                            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors rounded ${formData.category === "expense"
                                ? "bg-destructive text-destructive-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <TrendingDown size={16} className="inline mr-2" />
                            Expense
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Type *"
                            value={formData.type}
                            onChange={(e) => {
                                const newType = e.target.value as TransactionType;
                                setFormData({
                                    ...formData,
                                    type: newType,
                                    isSaleTransaction: newType === "sale_payment"
                                });
                            }}
                            options={currentTypeOptions}
                        />
                        <Input
                            label="Amount (OMR) *"
                            type="number"
                            value={formData.amount}
                            onChange={(e) => {
                                setFormData({ ...formData, amount: e.target.value });
                                if (formErrors.amount) setFormErrors({ ...formErrors, amount: false });
                            }}
                            error={formErrors.amount ? "Required" : undefined}
                        />
                        <Select
                            label="Project *"
                            value={formData.projectId}
                            onChange={(e) => {
                                setFormData({ ...formData, projectId: e.target.value });
                                if (formErrors.projectId) setFormErrors({ ...formErrors, projectId: false });
                            }}
                            options={[{ value: "", label: "Select..." }, ...projectOptions]}
                            error={formErrors.projectId ? "Required" : undefined}
                        />
                        <Select
                            label="Property *"
                            value={formData.propertyId}
                            onChange={(e) => {
                                setFormData({ ...formData, propertyId: e.target.value });
                                if (formErrors.propertyId) setFormErrors({ ...formErrors, propertyId: false });
                            }}
                            options={[{ value: "", label: "Select..." }, ...propertyOptions]}
                            error={formErrors.propertyId ? "Required" : undefined}
                        />
                        {/* Customer field for Income, Paid To field for Expense */}
                        {formData.category === "income" ? (
                            formData.type === "rent_payment" ? (
                                <SearchableSelect
                                    label="Customer *"
                                    value={formData.customerId}
                                    placeholder="Search by name or ID..."
                                    options={customers.map(c => ({
                                        value: c.id,
                                        label: c.name,
                                        subLabel: c.customerId
                                    }))}
                                    onChange={(value) => {
                                        const selectedCustomer = customers.find(c => c.id === value);

                                        // Find active rental for this customer
                                        const customerRental = rentals.find(r =>
                                            r.tenantId === value &&
                                            new Date(r.leaseEnd) >= new Date()
                                        );

                                        if (customerRental) {
                                            // Auto-populate from rental
                                            const rentalProperty = properties.find(p => p.id === customerRental.propertyId);
                                            setFormData({
                                                ...formData,
                                                customerId: value,
                                                paidBy: selectedCustomer?.name || "",
                                                propertyId: customerRental.propertyId,
                                                projectId: rentalProperty?.projectId || formData.projectId,
                                                rentalId: customerRental.id,
                                                amount: customerRental.monthlyRent.toString()
                                            });
                                        } else {
                                            setFormData({
                                                ...formData,
                                                customerId: value,
                                                paidBy: selectedCustomer?.name || "",
                                                rentalId: ""
                                            });
                                        }

                                        if (formErrors.customerId) setFormErrors({ ...formErrors, customerId: false });
                                        if (formErrors.amount) setFormErrors({ ...formErrors, amount: false });
                                    }}
                                    error={formErrors.customerId ? "Required" : undefined}
                                />
                            ) : (
                                <Select
                                    label="Customer *"
                                    value={formData.customerId}
                                    onChange={(e) => {
                                        const selectedCustomer = customers.find(c => c.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            customerId: e.target.value,
                                            paidBy: selectedCustomer?.name || "",
                                            rentalId: ""
                                        });
                                        if (formErrors.customerId) setFormErrors({ ...formErrors, customerId: false });
                                    }}
                                    options={[{ value: "", label: "Select..." }, ...customerOptions]}
                                    error={formErrors.customerId ? "Required" : undefined}
                                />
                            )
                        ) : (
                            <Input
                                label="Paid To *"
                                value={formData.paidBy}
                                onChange={(e) => {
                                    setFormData({ ...formData, paidBy: e.target.value });
                                    if (formErrors.paidBy) setFormErrors({ ...formErrors, paidBy: false });
                                }}
                                placeholder="Contractor, Vendor, etc."
                                error={formErrors.paidBy ? "Required" : undefined}
                            />
                        )}
                        {/* Rental dropdown for rent payments (auto-populated but can be changed) */}
                        {formData.category === "income" && formData.type === "rent_payment" && formData.customerId && (
                            <Select
                                label="Rental"
                                value={formData.rentalId}
                                onChange={(e) => {
                                    const selectedRental = rentals.find(r => r.id === e.target.value);
                                    if (selectedRental) {
                                        const rentalProperty = properties.find(p => p.id === selectedRental.propertyId);
                                        setFormData({
                                            ...formData,
                                            rentalId: e.target.value,
                                            propertyId: selectedRental.propertyId,
                                            projectId: rentalProperty?.projectId || formData.projectId,
                                            amount: selectedRental.monthlyRent.toString()
                                        });
                                    } else {
                                        setFormData({
                                            ...formData,
                                            rentalId: e.target.value
                                        });
                                    }
                                    if (formErrors.amount) setFormErrors({ ...formErrors, amount: false });
                                }}
                                options={[
                                    { value: "", label: "Select rental..." },
                                    ...rentals
                                        .filter(r => r.tenantId === formData.customerId)
                                        .map(r => {
                                            const prop = properties.find(p => p.id === r.propertyId);
                                            return {
                                                value: r.id,
                                                label: `${prop?.name || "Property"} - ${r.monthlyRent} OMR/month`
                                            };
                                        })
                                ]}
                            />
                        )}
                        <Select
                            label="Payment Method"
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            options={[
                                { value: "cash", label: "Cash" },
                                { value: "card", label: "Card" },
                                { value: "bank_transfer", label: "Bank Transfer" },
                                { value: "cheque", label: "Cheque" },
                            ]}
                        />
                        <Input
                            label="Date *"
                            type="date"
                            value={formData.date}
                            onChange={(e) => {
                                setFormData({ ...formData, date: e.target.value });
                                if (formErrors.date) setFormErrors({ ...formErrors, date: false });
                            }}
                            error={formErrors.date ? "Required" : undefined}
                        />
                        <Input
                            label="Reference"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            placeholder="Transaction ID, Cheque No., etc."
                        />

                        {/* Sale-specific fields */}
                        {formData.type === "sale_payment" && (
                            <>
                                <Input
                                    label="Total Sale Price (OMR) *"
                                    type="number"
                                    value={formData.totalSalePrice}
                                    onChange={(e) => {
                                        setFormData({ ...formData, totalSalePrice: e.target.value });
                                        if (formErrors.totalSalePrice) setFormErrors({ ...formErrors, totalSalePrice: false });
                                    }}
                                    error={formErrors.totalSalePrice ? "Required" : undefined}
                                />
                                <Select
                                    label="Payment Terms"
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    options={[
                                        { value: "lump_sum", label: "Lump Sum" },
                                        { value: "monthly", label: "Monthly" },
                                        { value: "quarterly", label: "Quarterly" },
                                        { value: "custom", label: "Custom" },
                                    ]}
                                />
                            </>
                        )}

                        <div className="md:col-span-2">
                            <Textarea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Transaction description..."
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* View Transaction Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={selectedTransaction ? `Transaction ${selectedTransaction.transactionNo}` : "Transaction Details"}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                            {t("common.close")}
                        </Button>
                        {selectedTransaction && (
                            <Button onClick={() => handleDownloadPdf(selectedTransaction)}>
                                <Download size={16} />
                                Download PDF
                            </Button>
                        )}
                    </>
                }
            >
                {selectedTransaction && (
                    <div className="space-y-4">
                        <div className={`text-center p-4 border ${selectedTransaction.category === "income" ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"}`}>
                            <div className="text-sm text-muted-foreground">{t("common.amount")}</div>
                            <div className={`text-3xl font-bold ${selectedTransaction.category === "income" ? "text-success" : "text-destructive"}`}>
                                {selectedTransaction.category === "income" ? "+" : "-"}{formatCurrency(selectedTransaction.amount)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">Transaction No.</div>
                                <div className="font-medium">{selectedTransaction.transactionNo}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">{t("common.date")}</div>
                                <div className="font-medium">{formatDate(selectedTransaction.date)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">Category</div>
                                <div className="font-medium capitalize">{selectedTransaction.category}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">{t("common.type")}</div>
                                <div className="font-medium">
                                    {[...incomeTypes, ...expenseTypes].find(t => t.value === selectedTransaction.type)?.label}
                                </div>
                            </div>
                            {selectedTransaction.project && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("projects.title")}</div>
                                    <div className="font-medium">{selectedTransaction.project.name}</div>
                                </div>
                            )}
                            {selectedTransaction.property && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("properties.title")}</div>
                                    <div className="font-medium">{selectedTransaction.property.name}</div>
                                </div>
                            )}
                            {selectedTransaction.customer && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("customers.title")}</div>
                                    <div className="font-medium">{selectedTransaction.customer.name}</div>
                                </div>
                            )}
                            {selectedTransaction.saleDetails && (
                                <>
                                    <div>
                                        <div className="text-muted-foreground">Total Sale Price</div>
                                        <div className="font-medium">{formatCurrency(selectedTransaction.saleDetails.totalPrice)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Remaining</div>
                                        <div className="font-medium text-warning">{formatCurrency(selectedTransaction.saleDetails.remainingAmount)}</div>
                                    </div>
                                </>
                            )}
                            {selectedTransaction.description && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("common.description")}</div>
                                    <div className="font-medium">{selectedTransaction.description}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
}
