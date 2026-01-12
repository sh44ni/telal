"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Textarea, Select, Badge, useToast } from "@/components/ui";
import type { Receipt, Customer, Property } from "@/types";
import { Plus, Download, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReceiptWithDetails extends Receipt {
    customer?: Customer;
    property?: Property;
}

export default function ReceiptsPage() {
    const { t } = useTranslation();
    const toast = useToast();

    const [receipts, setReceipts] = useState<ReceiptWithDetails[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithDetails | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        type: "rent",
        amount: "",
        paidBy: "",
        customerId: "",
        propertyId: "",
        paymentMethod: "cash",
        reference: "",
        description: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

    // Fetch data - run only once on mount
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [receiptsRes, customersRes, propertiesRes] = await Promise.all([
                fetch("/api/receipts"),
                fetch("/api/customers"),
                fetch("/api/properties"),
            ]);

            if (receiptsRes.ok) {
                const data = await receiptsRes.json();
                setReceipts(data);
            }
            if (customersRes.ok) {
                const data = await customersRes.json();
                setCustomers(data);
            }
            if (propertiesRes.ok) {
                const data = await propertiesRes.json();
                setProperties(data);
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

    const columns: Column<ReceiptWithDetails>[] = [
        { key: "receiptNo", label: t("receipts.receiptNo"), sortable: true },
        {
            key: "type",
            label: t("receipts.receiptType"),
            render: (item) => {
                const variants: Record<string, "default" | "success" | "warning" | "secondary"> = {
                    rent: "default",
                    deposit: "success",
                    maintenance: "warning",
                    other: "secondary",
                };
                return <Badge variant={variants[item.type]}>{t(`receipts.${item.type === "rent" ? "rentPayment" : item.type}`)}</Badge>;
            },
        },
        {
            key: "amount",
            label: t("common.amount"),
            sortable: true,
            render: (item) => formatCurrency(item.amount),
        },
        { key: "paidBy", label: t("receipts.paidBy") },
        {
            key: "paymentMethod",
            label: t("receipts.paymentMethod"),
            render: (item) => t(`receipts.${item.paymentMethod}`),
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
            type: "rent",
            amount: "",
            paidBy: "",
            customerId: "",
            propertyId: "",
            paymentMethod: "cash",
            reference: "",
            description: "",
        });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        // Validation
        const errors: Record<string, boolean> = {};
        if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = true;
        if (!formData.paidBy.trim()) errors.paidBy = true;
        if (!formData.customerId) errors.customerId = true;
        if (!formData.propertyId) errors.propertyId = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const response = await fetch("/api/receipts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: formData.type,
                    amount: parseFloat(formData.amount),
                    paidBy: formData.paidBy.trim(),
                    customerId: formData.customerId || undefined,
                    propertyId: formData.propertyId || undefined,
                    paymentMethod: formData.paymentMethod,
                    reference: formData.reference || undefined,
                    description: formData.description,
                }),
            });

            if (response.ok) {
                const newReceipt = await response.json();
                toast.success(`Receipt generated: ${newReceipt.receiptNo}`);
                setIsModalOpen(false);
                fetchData();
            } else {
                const err = await response.json();
                toast.error(err.error || "Failed to create receipt");
            }
        } catch (error) {
            console.error("Error creating receipt:", error);
            toast.error("Failed to create receipt");
        }
    };

    const handleDelete = async (receipt: ReceiptWithDetails) => {
        if (!confirm(`Delete receipt "${receipt.receiptNo}"?`)) return;

        try {
            const response = await fetch(`/api/receipts/${receipt.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Receipt deleted");
                fetchData();
            } else {
                toast.error("Failed to delete receipt");
            }
        } catch (error) {
            console.error("Error deleting receipt:", error);
            toast.error("Failed to delete receipt");
        }
    };

    const handleView = (receipt: ReceiptWithDetails) => {
        setSelectedReceipt(receipt);
        setIsViewModalOpen(true);
    };

    const handleDownloadPdf = async (receipt: ReceiptWithDetails) => {
        setDownloadingPdf(receipt.id);
        toast.info("Generating PDF...");
        try {
            const response = await fetch("/api/generate-receipt-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receipt }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `receipt-${receipt.receiptNo}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast.success("PDF downloaded");
            } else {
                const err = await response.json();
                toast.error(err.error || "Failed to generate PDF");
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

    return (
        <PageContainer
            title={t("receipts.title")}
            actions={
                <Button onClick={handleOpenModal}>
                    <Plus size={18} />
                    {t("receipts.generateReceipt")}
                </Button>
            }
        >
            <DataTable
                data={receipts}
                columns={columns}
                keyField="id"
                loading={loading}
                loadingLabel="Loading receipts..."
                onDelete={handleDelete}
                actions={(item) => (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleView(item)}
                            className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                            title="View Receipt"
                        >
                            <Eye size={16} />
                        </button>
                        <button
                            onClick={() => handleDownloadPdf(item)}
                            disabled={downloadingPdf === item.id}
                            className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                            title={t("common.download")}
                        >
                            <Download size={16} className={downloadingPdf === item.id ? "animate-pulse" : ""} />
                        </button>
                    </div>
                )}
            />

            {/* Create Receipt Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t("receipts.generateReceipt")}
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSubmit}>{t("receipts.generateReceipt")}</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label={t("receipts.receiptType")}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        options={[
                            { value: "rent", label: t("receipts.rentPayment") },
                            { value: "deposit", label: t("receipts.deposit") },
                            { value: "maintenance", label: t("receipts.maintenance") },
                            { value: "other", label: t("receipts.other") },
                        ]}
                    />
                    <Input
                        label={t("common.amount") + " (OMR) *"}
                        type="number"
                        value={formData.amount}
                        onChange={(e) => {
                            setFormData({ ...formData, amount: e.target.value });
                            if (formErrors.amount) setFormErrors({ ...formErrors, amount: false });
                        }}
                        error={formErrors.amount ? "Required" : undefined}
                    />
                    <Input
                        label={t("receipts.paidBy") + " *"}
                        value={formData.paidBy}
                        onChange={(e) => {
                            setFormData({ ...formData, paidBy: e.target.value });
                            if (formErrors.paidBy) setFormErrors({ ...formErrors, paidBy: false });
                        }}
                        error={formErrors.paidBy ? "Required" : undefined}
                    />
                    <Select
                        label={t("receipts.paymentMethod")}
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        options={[
                            { value: "cash", label: t("receipts.cash") },
                            { value: "card", label: t("receipts.card") },
                            { value: "bank_transfer", label: t("receipts.bankTransfer") },
                            { value: "cheque", label: t("receipts.cheque") },
                        ]}
                    />
                    <Select
                        label={t("customers.title") + " *"}
                        value={formData.customerId}
                        onChange={(e) => {
                            const selectedCustomer = customers.find(c => c.id === e.target.value);
                            setFormData({
                                ...formData,
                                customerId: e.target.value,
                                paidBy: selectedCustomer?.name || formData.paidBy
                            });
                            if (formErrors.customerId) setFormErrors({ ...formErrors, customerId: false });
                            if (formErrors.paidBy && selectedCustomer) setFormErrors({ ...formErrors, paidBy: false });
                        }}
                        options={[{ value: "", label: t("common.select") + "..." }, ...customerOptions]}
                        error={formErrors.customerId ? "Required" : undefined}
                    />
                    <Select
                        label={t("properties.title") + " *"}
                        value={formData.propertyId}
                        onChange={(e) => {
                            setFormData({ ...formData, propertyId: e.target.value });
                            if (formErrors.propertyId) setFormErrors({ ...formErrors, propertyId: false });
                        }}
                        options={[{ value: "", label: t("common.select") + "..." }, ...propertyOptions]}
                        error={formErrors.propertyId ? "Required" : undefined}
                    />
                    <Input
                        label={t("receipts.reference") + " (" + t("common.optional") + ")"}
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        placeholder="Transaction ID, Cheque No., etc."
                    />
                    <div className="md:col-span-2">
                        <Textarea
                            label={t("common.description")}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Payment description..."
                        />
                    </div>
                </div>
            </Modal>

            {/* View Receipt Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={selectedReceipt ? `Receipt ${selectedReceipt.receiptNo}` : "Receipt Details"}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                            {t("common.close")}
                        </Button>
                        {selectedReceipt && (
                            <Button onClick={() => handleDownloadPdf(selectedReceipt)}>
                                <Download size={16} />
                                {t("common.download")} PDF
                            </Button>
                        )}
                    </>
                }
            >
                {selectedReceipt && (
                    <div className="space-y-4">
                        <div className="text-center p-4 bg-primary/10 border border-primary/20">
                            <div className="text-sm text-muted-foreground">{t("common.amount")}</div>
                            <div className="text-3xl font-bold text-primary">{formatCurrency(selectedReceipt.amount)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-muted-foreground">{t("receipts.receiptNo")}</div>
                                <div className="font-medium">{selectedReceipt.receiptNo}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">{t("common.date")}</div>
                                <div className="font-medium">{formatDate(selectedReceipt.date)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">{t("receipts.receiptType")}</div>
                                <div className="font-medium">{t(`receipts.${selectedReceipt.type === "rent" ? "rentPayment" : selectedReceipt.type}`)}</div>
                            </div>
                            <div>
                                <div className="text-muted-foreground">{t("receipts.paymentMethod")}</div>
                                <div className="font-medium">{t(`receipts.${selectedReceipt.paymentMethod}`)}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-muted-foreground">{t("receipts.paidBy")}</div>
                                <div className="font-medium">{selectedReceipt.paidBy}</div>
                            </div>
                            {selectedReceipt.customer && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("customers.title")}</div>
                                    <div className="font-medium">{selectedReceipt.customer.name}</div>
                                </div>
                            )}
                            {selectedReceipt.property && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("properties.title")}</div>
                                    <div className="font-medium">{selectedReceipt.property.name}</div>
                                </div>
                            )}
                            {selectedReceipt.reference && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("receipts.reference")}</div>
                                    <div className="font-medium">{selectedReceipt.reference}</div>
                                </div>
                            )}
                            {selectedReceipt.description && (
                                <div className="col-span-2">
                                    <div className="text-muted-foreground">{t("common.description")}</div>
                                    <div className="font-medium">{selectedReceipt.description}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
}
