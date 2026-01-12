"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Select, Badge, Tabs, useToast, Card, CardContent, ConfirmDialog } from "@/components/ui";
import type { RentalContract, PaymentFrequency, SaleContract } from "@/types";
import { Plus, FileText, Download, Trash2, FileCheck } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Initial form state for rental contracts
const initialRentalFormData = {
    // Landlord
    landlordName: "",
    landlordCR: "",
    landlordPOBox: "",
    landlordPostalCode: "",
    landlordAddress: "",
    // Tenant
    tenantName: "",
    tenantIdPassport: "",
    tenantLabourCard: "",
    tenantPhone: "",
    tenantEmail: "",
    tenantSponsor: "",
    tenantCR: "",
    // Terms
    validFrom: "",
    validTo: "",
    agreementPeriod: "",
    monthlyRent: "",
    paymentFrequency: "monthly" as PaymentFrequency,
    // Signatures
    landlordSignature: "",
    landlordSignDate: "",
    tenantSignature: "",
    tenantSignDate: "",
};

// Initial form state for sale contracts
const initialSaleFormData = {
    // Seller
    sellerId: "",
    sellerName: "",
    sellerCR: "",
    sellerNationality: "",
    sellerAddress: "",
    sellerPhone: "",
    // Buyer
    buyerId: "",
    buyerName: "",
    buyerCR: "",
    buyerNationality: "",
    buyerAddress: "",
    buyerPhone: "",
    // Property
    propertyWilaya: "",
    propertyGovernorate: "",
    propertyPhase: "",
    propertyLandNumber: "",
    propertyArea: "",
    // Payment
    totalPrice: "",
    totalPriceWords: "",
    depositAmount: "",
    depositAmountWords: "",
    depositDate: "",
    remainingAmount: "",
    remainingAmountWords: "",
    remainingDueDate: "",
    finalPaymentAmount: "",
    finalPaymentAmountWords: "",
    // Construction
    constructionStartDate: "",
    constructionEndDate: "",
    notes: "",
    // Signatures
    sellerSignature: "",
    buyerSignature: "",
};

export default function ContractsPage() {
    const { t } = useTranslation();
    const toast = useToast();

    // State for rental contracts
    const [contracts, setContracts] = useState<RentalContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const [formData, setFormData] = useState(initialRentalFormData);
    const [generating, setGenerating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; contract: RentalContract | null }>({
        isOpen: false,
        contract: null,
    });
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

    // State for sale contracts
    const [saleContracts, setSaleContracts] = useState<SaleContract[]>([]);
    const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
    const [editingSaleContract, setEditingSaleContract] = useState<SaleContract | null>(null);
    const [saleFormData, setSaleFormData] = useState(initialSaleFormData);
    const [generatingSale, setGeneratingSale] = useState(false);
    const [deleteSaleConfirm, setDeleteSaleConfirm] = useState<{ isOpen: boolean; contract: SaleContract | null }>({
        isOpen: false,
        contract: null,
    });

    // Fetch contracts
    useEffect(() => {
        fetchContracts();
        fetchSaleContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await fetch("/api/rental-contracts");
            if (response.ok) {
                const data = await response.json();
                setContracts(data);
            }
        } catch (error) {
            console.error("Failed to fetch contracts:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSaleContracts = async () => {
        try {
            const response = await fetch("/api/sale-contracts");
            if (response.ok) {
                const data = await response.json();
                setSaleContracts(data);
            }
        } catch (error) {
            console.error("Failed to fetch sale contracts:", error);
        }
    };

    // Combine both contract types for display
    const allContracts = [
        ...contracts.map(c => ({ ...c, contractType: 'rental' as const })),
        ...saleContracts.map(c => ({ ...c, contractType: 'sale' as const, tenantName: c.buyerName, landlordName: c.sellerName, monthlyRent: c.totalPrice, validFrom: c.createdAt, validTo: c.createdAt }))
    ];

    const tabs = [
        { id: "all", label: t("common.all"), count: allContracts.length },
        { id: "rental", label: "Rental", count: contracts.length },
        { id: "sale", label: "Sale", count: saleContracts.length },
        { id: "signed", label: t("contracts.signed"), count: allContracts.filter(c => c.status === "signed").length },
        { id: "draft", label: t("contracts.draft"), count: allContracts.filter(c => c.status === "draft").length },
    ];

    // Filter contracts based on active tab and search
    const filteredContracts = allContracts
        .filter(c => {
            if (activeTab === "all") return true;
            if (activeTab === "rental") return c.contractType === "rental";
            if (activeTab === "sale") return c.contractType === "sale";
            return c.status === activeTab;
        })
        .filter(c =>
            !searchQuery ||
            c.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.contractType === 'rental' && (c as RentalContract).tenantName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (c.contractType === 'sale' && (c as unknown as SaleContract).buyerName?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const columns: Column<typeof allContracts[0]>[] = [
        { key: "contractNumber", label: "Contract #", sortable: true },
        {
            key: "contractType",
            label: "Type",
            render: (item) => (
                <Badge variant={item.contractType === 'rental' ? 'default' : 'warning'}>
                    {item.contractType === 'rental' ? 'Rental' : 'Sale'}
                </Badge>
            )
        },
        {
            key: "tenantName",
            label: "Client",
            sortable: true,
            render: (item) => item.contractType === 'rental'
                ? (item as RentalContract).tenantName
                : (item as unknown as SaleContract).buyerName
        },
        {
            key: "landlordName",
            label: "Owner/Seller",
            sortable: true,
            render: (item) => item.contractType === 'rental'
                ? (item as RentalContract).landlordName
                : (item as unknown as SaleContract).sellerName
        },
        {
            key: "monthlyRent",
            label: "Amount",
            sortable: true,
            render: (item) => formatCurrency(item.contractType === 'rental'
                ? (item as RentalContract).monthlyRent
                : (item as unknown as SaleContract).totalPrice),
        },
        {
            key: "status",
            label: t("common.status"),
            render: (item) => {
                const variants: Record<string, "success" | "warning" | "secondary" | "danger"> = {
                    signed: "success",
                    draft: "warning",
                    expired: "secondary",
                    cancelled: "danger",
                };
                return <Badge variant={variants[item.status]}>{t(`contracts.${item.status}`)}</Badge>;
            },
        },
        {
            key: "createdAt",
            label: "Created",
            render: (item) => formatDate(item.createdAt),
        },
    ];

    // Rental contract handlers
    const handleOpenModal = (contract?: RentalContract) => {
        setFormErrors({});
        setShakeFields({});

        if (contract) {
            setEditingContract(contract);
            setFormData({
                landlordName: contract.landlordName || "",
                landlordCR: contract.landlordCR || "",
                landlordPOBox: contract.landlordPOBox || "",
                landlordPostalCode: contract.landlordPostalCode || "",
                landlordAddress: contract.landlordAddress || "",
                tenantName: contract.tenantName || "",
                tenantIdPassport: contract.tenantIdPassport || "",
                tenantLabourCard: contract.tenantLabourCard || "",
                tenantPhone: contract.tenantPhone || "",
                tenantEmail: contract.tenantEmail || "",
                tenantSponsor: contract.tenantSponsor || "",
                tenantCR: contract.tenantCR || "",
                validFrom: contract.validFrom || "",
                validTo: contract.validTo || "",
                agreementPeriod: contract.agreementPeriod || "",
                monthlyRent: contract.monthlyRent?.toString() || "",
                paymentFrequency: contract.paymentFrequency || "monthly",
                landlordSignature: contract.landlordSignature || "",
                landlordSignDate: contract.landlordSignDate || "",
                tenantSignature: contract.tenantSignature || "",
                tenantSignDate: contract.tenantSignDate || "",
            });
        } else {
            setEditingContract(null);
            setFormData(initialRentalFormData);
        }
        setIsModalOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {};

        if (!formData.landlordName.trim()) errors.landlordName = true;
        if (!formData.tenantName.trim()) errors.tenantName = true;
        if (!formData.tenantIdPassport.trim()) errors.tenantIdPassport = true;
        if (!formData.tenantPhone.trim()) errors.tenantPhone = true;
        if (!formData.validFrom) errors.validFrom = true;
        if (!formData.validTo) errors.validTo = true;
        if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) errors.monthlyRent = true;

        if (formData.validFrom && formData.validTo) {
            const start = new Date(formData.validFrom);
            const end = new Date(formData.validTo);
            if (end <= start) {
                errors.validTo = true;
                toast.error("Contract end date must be after start date");
            }
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            setShakeFields(errors);
            setTimeout(() => setShakeFields({}), 500);
            if (!errors.validTo || Object.keys(errors).length > 1) {
                toast.error("Please fill all required fields");
            }
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setGenerating(true);

        try {
            const contractData: Partial<RentalContract> = {
                id: editingContract?.id,
                contractNumber: editingContract?.contractNumber,
                type: "rental",
                status: "signed",
                landlordName: formData.landlordName,
                landlordCR: formData.landlordCR,
                landlordPOBox: formData.landlordPOBox,
                landlordPostalCode: formData.landlordPostalCode,
                landlordAddress: formData.landlordAddress,
                tenantName: formData.tenantName,
                tenantIdPassport: formData.tenantIdPassport,
                tenantLabourCard: formData.tenantLabourCard || undefined,
                tenantPhone: formData.tenantPhone,
                tenantEmail: formData.tenantEmail,
                tenantSponsor: formData.tenantSponsor || undefined,
                tenantCR: formData.tenantCR || undefined,
                validFrom: formData.validFrom,
                validTo: formData.validTo,
                agreementPeriod: formData.agreementPeriod,
                monthlyRent: parseFloat(formData.monthlyRent) || 0,
                paymentFrequency: formData.paymentFrequency,
                landlordSignature: formData.landlordSignature,
                landlordSignDate: formData.landlordSignDate,
                tenantSignature: formData.tenantSignature,
                tenantSignDate: formData.tenantSignDate,
            };

            const method = editingContract ? "PUT" : "POST";
            const url = editingContract
                ? `/api/rental-contracts/${editingContract.id}`
                : "/api/rental-contracts";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contractData),
            });

            if (response.ok) {
                const savedContract = await response.json();

                try {
                    const pdfResponse = await fetch("/api/generate-pdf", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contract: savedContract }),
                    });

                    if (pdfResponse.ok) {
                        const blob = await pdfResponse.blob();
                        const pdfUrl = URL.createObjectURL(blob);

                        const link = document.createElement("a");
                        link.href = pdfUrl;
                        link.download = `${savedContract.contractNumber}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(pdfUrl);
                    } else {
                        const errorData = await pdfResponse.json();
                        throw new Error(errorData.error || "PDF generation failed");
                    }
                } catch (pdfError) {
                    console.error("PDF generation error:", pdfError);
                    toast.warning("Contract saved but PDF generation failed");
                }

                toast.success(editingContract ? "Contract updated" : `Contract created: ${savedContract.contractNumber}`);
                fetchContracts();
                setIsModalOpen(false);
            } else {
                toast.error("Failed to save contract");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred");
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteClick = (contract: RentalContract) => {
        setDeleteConfirm({ isOpen: true, contract });
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirm.contract) {
            setDeleting(true);
            try {
                await fetch(`/api/rental-contracts/${deleteConfirm.contract.id}`, { method: "DELETE" });
                toast.success("Contract deleted");
                fetchContracts();
            } catch (error) {
                toast.error("Failed to delete contract");
            } finally {
                setDeleting(false);
            }
        }
        setDeleteConfirm({ isOpen: false, contract: null });
    };

    const handleDownloadPDF = async (contract: RentalContract) => {
        try {
            const response = await fetch("/api/generate-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contract }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const pdfUrl = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = pdfUrl;
                link.download = `${contract.contractNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(pdfUrl);

                toast.success("PDF downloaded");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "PDF generation failed");
            }
        } catch (error) {
            console.error("PDF error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    // Sale contract handlers
    const handleOpenSaleModal = (contract?: SaleContract) => {
        setFormErrors({});
        setShakeFields({});

        if (contract) {
            setEditingSaleContract(contract);
            setSaleFormData({
                sellerId: contract.sellerCivilId || contract.sellerId || "",
                sellerName: contract.sellerName || "",
                sellerCR: contract.sellerCR || "",
                sellerNationality: contract.sellerNationality || "",
                sellerAddress: contract.sellerAddress || "",
                sellerPhone: contract.sellerPhone || "",
                buyerId: contract.buyerCivilId || contract.buyerId || "",
                buyerName: contract.buyerName || "",
                buyerCR: contract.buyerCR || "",
                buyerNationality: contract.buyerNationality || "",
                buyerAddress: contract.buyerAddress || "",
                buyerPhone: contract.buyerPhone || "",
                propertyWilaya: contract.propertyWilaya || "",
                propertyGovernorate: contract.propertyGovernorate || "",
                propertyPhase: contract.propertyPhase || "",
                propertyLandNumber: contract.propertyLandNumber || "",
                propertyArea: contract.propertyArea || "",
                totalPrice: contract.totalPrice?.toString() || "",
                totalPriceWords: contract.totalPriceWords || "",
                depositAmount: contract.depositAmount?.toString() || "",
                depositAmountWords: contract.depositAmountWords || "",
                depositDate: contract.depositDate || "",
                remainingAmount: contract.remainingAmount?.toString() || "",
                remainingAmountWords: contract.remainingAmountWords || "",
                remainingDueDate: contract.remainingDueDate || "",
                finalPaymentAmount: contract.finalPaymentAmount?.toString() || "",
                finalPaymentAmountWords: contract.finalPaymentAmountWords || "",
                constructionStartDate: contract.constructionStartDate || "",
                constructionEndDate: contract.constructionEndDate || "",
                notes: contract.notes || "",
                sellerSignature: contract.sellerSignature || "",
                buyerSignature: contract.buyerSignature || "",
            });
        } else {
            setEditingSaleContract(null);
            setSaleFormData(initialSaleFormData);
        }
        setIsSaleModalOpen(true);
    };

    const validateSaleForm = (): boolean => {
        const errors: Record<string, boolean> = {};

        if (!saleFormData.sellerName.trim()) errors.sellerName = true;
        if (!saleFormData.buyerName.trim()) errors.buyerName = true;
        if (!saleFormData.propertyWilaya.trim()) errors.propertyWilaya = true;
        if (!saleFormData.totalPrice || parseFloat(saleFormData.totalPrice) <= 0) errors.totalPrice = true;

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            setShakeFields(errors);
            setTimeout(() => setShakeFields({}), 500);
            toast.error("Please fill all required fields");
            return false;
        }

        return true;
    };

    const handleSaleSubmit = async () => {
        if (!validateSaleForm()) return;

        setGeneratingSale(true);

        try {
            const contractData = {
                ...saleFormData,
                id: editingSaleContract?.id,
                contractNumber: editingSaleContract?.contractNumber,
                status: "signed",
            };

            const method = editingSaleContract ? "PUT" : "POST";
            const url = editingSaleContract
                ? `/api/sale-contracts/${editingSaleContract.id}`
                : "/api/sale-contracts";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contractData),
            });

            if (response.ok) {
                const savedContract = await response.json();

                try {
                    const pdfResponse = await fetch("/api/generate-sale-pdf", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contract: savedContract }),
                    });

                    if (pdfResponse.ok) {
                        const blob = await pdfResponse.blob();
                        const pdfUrl = URL.createObjectURL(blob);

                        const link = document.createElement("a");
                        link.href = pdfUrl;
                        link.download = `${savedContract.contractNumber}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(pdfUrl);
                    } else {
                        const errorData = await pdfResponse.json();
                        throw new Error(errorData.error || "PDF generation failed");
                    }
                } catch (pdfError) {
                    console.error("PDF generation error:", pdfError);
                    toast.warning("Contract saved but PDF generation failed");
                }

                toast.success(editingSaleContract ? "Sale Contract updated" : `Sale Contract created: ${savedContract.contractNumber}`);
                fetchSaleContracts();
                setIsSaleModalOpen(false);
            } else {
                toast.error("Failed to save sale contract");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred");
        } finally {
            setGeneratingSale(false);
        }
    };

    const handleDownloadSalePDF = async (contract: SaleContract) => {
        try {
            const response = await fetch("/api/generate-sale-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contract }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const pdfUrl = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = pdfUrl;
                link.download = `${contract.contractNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(pdfUrl);

                toast.success("PDF downloaded");
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || "PDF generation failed");
            }
        } catch (error) {
            console.error("PDF error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    const handleDeleteSaleClick = (contract: SaleContract) => {
        setDeleteSaleConfirm({ isOpen: true, contract });
    };

    const handleDeleteSaleConfirm = async () => {
        if (deleteSaleConfirm.contract) {
            try {
                await fetch(`/api/sale-contracts/${deleteSaleConfirm.contract.id}`, { method: "DELETE" });
                toast.success("Sale contract deleted");
                fetchSaleContracts();
            } catch (error) {
                toast.error("Failed to delete sale contract");
            }
        }
        setDeleteSaleConfirm({ isOpen: false, contract: null });
    };

    return (
        <PageContainer
            title={t("contracts.title")}
            actions={
                <div className="flex gap-2">
                    <Button onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Rental Contract
                    </Button>
                    <Button variant="outline" onClick={() => handleOpenSaleModal()}>
                        <FileCheck size={18} />
                        Sale Contract
                    </Button>
                </div>
            }
        >
            {/* Search */}
            <div className="mb-4">
                <Input
                    placeholder="Search by Contract #, Client, or Owner..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-4">
                <DataTable
                    data={filteredContracts}
                    columns={columns}
                    keyField="id"
                    loading={loading}
                    loadingLabel="Loading contracts..."
                    onEdit={(item) => {
                        if (item.contractType === 'rental') {
                            handleOpenModal(item as RentalContract);
                        } else {
                            // Find the original sale contract
                            const saleContract = saleContracts.find(c => c.id === item.id);
                            if (saleContract) handleOpenSaleModal(saleContract);
                        }
                    }}
                    actions={(item) => (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    if (item.contractType === 'rental') {
                                        handleDownloadPDF(item as RentalContract);
                                    } else {
                                        const saleContract = saleContracts.find(c => c.id === item.id);
                                        if (saleContract) handleDownloadSalePDF(saleContract);
                                    }
                                }}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                title="Download PDF"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => {
                                    if (item.contractType === 'rental') {
                                        handleDeleteClick(item as RentalContract);
                                    } else {
                                        const saleContract = saleContracts.find(c => c.id === item.id);
                                        if (saleContract) handleDeleteSaleClick(saleContract);
                                    }
                                }}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Rental Contract Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingContract ? "Edit Rental Contract" : "Create Rental Contract"}
                size="xl"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={generating}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSubmit} loading={generating}>
                            {generating ? "Generating PDF..." : "Generate & Save Contract"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Landlord Section */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Landlord Details (First Party) - بيانات الموجر
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Name / الاسم *"
                                    value={formData.landlordName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, landlordName: e.target.value });
                                        if (formErrors.landlordName) setFormErrors({ ...formErrors, landlordName: false });
                                    }}
                                    shake={shakeFields.landlordName}
                                />
                                <Input
                                    label="CR No / رقم السجل التجاري *"
                                    value={formData.landlordCR}
                                    onChange={(e) => setFormData({ ...formData, landlordCR: e.target.value })}
                                />
                                <Input
                                    label="P.O. Box / صندوق البريد"
                                    value={formData.landlordPOBox}
                                    onChange={(e) => setFormData({ ...formData, landlordPOBox: e.target.value })}
                                />
                                <Input
                                    label="Postal Code / الرمز البريدي"
                                    value={formData.landlordPostalCode}
                                    onChange={(e) => setFormData({ ...formData, landlordPostalCode: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Address / العنوان *"
                                        value={formData.landlordAddress}
                                        onChange={(e) => setFormData({ ...formData, landlordAddress: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tenant Section */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Tenant Details (Second Party) - بيانات المستأجر
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Name / الاسم *"
                                    value={formData.tenantName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, tenantName: e.target.value });
                                        if (formErrors.tenantName) setFormErrors({ ...formErrors, tenantName: false });
                                    }}
                                    shake={shakeFields.tenantName}
                                />
                                <Input
                                    label="ID/Passport / رقم الهوية *"
                                    value={formData.tenantIdPassport}
                                    onChange={(e) => {
                                        setFormData({ ...formData, tenantIdPassport: e.target.value });
                                        if (formErrors.tenantIdPassport) setFormErrors({ ...formErrors, tenantIdPassport: false });
                                    }}
                                    shake={shakeFields.tenantIdPassport}
                                />
                                <Input
                                    label="Labour Card (Expats) / بطاقة العمل"
                                    value={formData.tenantLabourCard}
                                    onChange={(e) => setFormData({ ...formData, tenantLabourCard: e.target.value })}
                                />
                                <Input
                                    label="Phone / الهاتف *"
                                    value={formData.tenantPhone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, tenantPhone: e.target.value });
                                        if (formErrors.tenantPhone) setFormErrors({ ...formErrors, tenantPhone: false });
                                    }}
                                    shake={shakeFields.tenantPhone}
                                />
                                <Input
                                    label="Email / البريد الإلكتروني"
                                    type="email"
                                    value={formData.tenantEmail}
                                    onChange={(e) => setFormData({ ...formData, tenantEmail: e.target.value })}
                                />
                                <Input
                                    label="Sponsor Name / اسم الكفيل"
                                    value={formData.tenantSponsor}
                                    onChange={(e) => setFormData({ ...formData, tenantSponsor: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="CR (for companies) / السجل التجاري"
                                        value={formData.tenantCR}
                                        onChange={(e) => setFormData({ ...formData, tenantCR: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contract Terms */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Contract Terms - شروط العقد
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Valid From / يبدأ في *"
                                    type="date"
                                    value={formData.validFrom}
                                    onChange={(e) => {
                                        setFormData({ ...formData, validFrom: e.target.value });
                                        if (formErrors.validFrom) setFormErrors({ ...formErrors, validFrom: false });
                                    }}
                                    shake={shakeFields.validFrom}
                                />
                                <Input
                                    label="Valid To / ينتهي في *"
                                    type="date"
                                    value={formData.validTo}
                                    onChange={(e) => {
                                        setFormData({ ...formData, validTo: e.target.value });
                                        if (formErrors.validTo) setFormErrors({ ...formErrors, validTo: false });
                                    }}
                                    shake={shakeFields.validTo}
                                />
                                <Input
                                    label="Agreement Period / مدة العقد *"
                                    placeholder="e.g., 1 year, 6 months"
                                    value={formData.agreementPeriod}
                                    onChange={(e) => setFormData({ ...formData, agreementPeriod: e.target.value })}
                                />
                                <Input
                                    label="Monthly Rent (OMR) / الإيجار الشهري *"
                                    type="number"
                                    step="0.001"
                                    value={formData.monthlyRent}
                                    onChange={(e) => {
                                        setFormData({ ...formData, monthlyRent: e.target.value });
                                        if (formErrors.monthlyRent) setFormErrors({ ...formErrors, monthlyRent: false });
                                    }}
                                    shake={shakeFields.monthlyRent}
                                />
                                <Select
                                    label="Payment Frequency / دورية الدفع *"
                                    value={formData.paymentFrequency}
                                    onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value as PaymentFrequency })}
                                    options={[
                                        { value: "monthly", label: "Monthly / شهري" },
                                        { value: "quarterly", label: "Quarterly / ربع سنوي" },
                                        { value: "yearly", label: "Yearly / سنوي" },
                                    ]}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signatures */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Signatures - التوقيعات
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-medium">Landlord / المؤجر</h4>
                                    <Input
                                        label="Signature (Name) / التوقيع"
                                        value={formData.landlordSignature}
                                        onChange={(e) => setFormData({ ...formData, landlordSignature: e.target.value })}
                                    />
                                    <Input
                                        label="Date / التاريخ"
                                        type="date"
                                        value={formData.landlordSignDate}
                                        onChange={(e) => setFormData({ ...formData, landlordSignDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-medium">Tenant / المستأجر</h4>
                                    <Input
                                        label="Signature (Name) / التوقيع"
                                        value={formData.tenantSignature}
                                        onChange={(e) => setFormData({ ...formData, tenantSignature: e.target.value })}
                                    />
                                    <Input
                                        label="Date / التاريخ"
                                        type="date"
                                        value={formData.tenantSignDate}
                                        onChange={(e) => setFormData({ ...formData, tenantSignDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Modal>

            {/* Sale Contract Form Modal */}
            <Modal
                isOpen={isSaleModalOpen}
                onClose={() => setIsSaleModalOpen(false)}
                title={editingSaleContract ? "Edit Sale Contract" : "Create Sale Contract"}
                size="xl"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsSaleModalOpen(false)} disabled={generatingSale}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSaleSubmit} loading={generatingSale}>
                            {generatingSale ? "Generating PDF..." : "Generate & Save Contract"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {/* Seller Section */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Seller Details (First Party) - بيانات البائع
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Seller ID / رقم التعريف"
                                    value={saleFormData.sellerId}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, sellerId: e.target.value })}
                                />
                                <Input
                                    label="Seller Name / اسم البائع *"
                                    value={saleFormData.sellerName}
                                    onChange={(e) => {
                                        setSaleFormData({ ...saleFormData, sellerName: e.target.value });
                                        if (formErrors.sellerName) setFormErrors({ ...formErrors, sellerName: false });
                                    }}
                                    shake={shakeFields.sellerName}
                                />
                                <Input
                                    label="CR No / رقم السجل التجاري"
                                    value={saleFormData.sellerCR}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, sellerCR: e.target.value })}
                                />
                                <Input
                                    label="Nationality / الجنسية"
                                    value={saleFormData.sellerNationality}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, sellerNationality: e.target.value })}
                                />
                                <Input
                                    label="Address / العنوان"
                                    value={saleFormData.sellerAddress}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, sellerAddress: e.target.value })}
                                />
                                <Input
                                    label="Phone / الهاتف"
                                    value={saleFormData.sellerPhone}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, sellerPhone: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Buyer Section */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Buyer Details (Second Party) - بيانات المشتري
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Buyer ID / رقم التعريف"
                                    value={saleFormData.buyerId}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, buyerId: e.target.value })}
                                />
                                <Input
                                    label="Buyer Name / اسم المشتري *"
                                    value={saleFormData.buyerName}
                                    onChange={(e) => {
                                        setSaleFormData({ ...saleFormData, buyerName: e.target.value });
                                        if (formErrors.buyerName) setFormErrors({ ...formErrors, buyerName: false });
                                    }}
                                    shake={shakeFields.buyerName}
                                />
                                <Input
                                    label="CR No / رقم السجل التجاري"
                                    value={saleFormData.buyerCR}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, buyerCR: e.target.value })}
                                />
                                <Input
                                    label="Nationality / الجنسية"
                                    value={saleFormData.buyerNationality}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, buyerNationality: e.target.value })}
                                />
                                <Input
                                    label="Address / العنوان"
                                    value={saleFormData.buyerAddress}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, buyerAddress: e.target.value })}
                                />
                                <Input
                                    label="Phone / الهاتف"
                                    value={saleFormData.buyerPhone}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, buyerPhone: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Property Details */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Property Details - تفاصيل العقار
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Wilaya / الولاية *"
                                    value={saleFormData.propertyWilaya}
                                    onChange={(e) => {
                                        setSaleFormData({ ...saleFormData, propertyWilaya: e.target.value });
                                        if (formErrors.propertyWilaya) setFormErrors({ ...formErrors, propertyWilaya: false });
                                    }}
                                    shake={shakeFields.propertyWilaya}
                                />
                                <Input
                                    label="Governorate / المحافظة"
                                    value={saleFormData.propertyGovernorate}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, propertyGovernorate: e.target.value })}
                                />
                                <Input
                                    label="Phase / المرحلة"
                                    value={saleFormData.propertyPhase}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, propertyPhase: e.target.value })}
                                />
                                <Input
                                    label="Land Number / رقم الأرض"
                                    value={saleFormData.propertyLandNumber}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, propertyLandNumber: e.target.value })}
                                />
                                <Input
                                    label="Area (sqm) / المساحة"
                                    value={saleFormData.propertyArea}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, propertyArea: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Terms */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Payment Terms - شروط الدفع
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Total Price (OMR) / السعر الإجمالي *"
                                    type="number"
                                    step="0.001"
                                    value={saleFormData.totalPrice}
                                    onChange={(e) => {
                                        setSaleFormData({ ...saleFormData, totalPrice: e.target.value });
                                        if (formErrors.totalPrice) setFormErrors({ ...formErrors, totalPrice: false });
                                    }}
                                    shake={shakeFields.totalPrice}
                                />
                                <Input
                                    label="Total Price in Words / المبلغ كتابة"
                                    value={saleFormData.totalPriceWords}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, totalPriceWords: e.target.value })}
                                />
                                <Input
                                    label="Deposit Amount (OMR) / مبلغ العربون"
                                    type="number"
                                    step="0.001"
                                    value={saleFormData.depositAmount}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, depositAmount: e.target.value })}
                                />
                                <Input
                                    label="Deposit in Words / العربون كتابة"
                                    value={saleFormData.depositAmountWords}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, depositAmountWords: e.target.value })}
                                />
                                <Input
                                    label="Deposit Date / تاريخ العربون"
                                    type="date"
                                    value={saleFormData.depositDate}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, depositDate: e.target.value })}
                                />
                                <Input
                                    label="Remaining Amount (OMR) / المبلغ المتبقي"
                                    type="number"
                                    step="0.001"
                                    value={saleFormData.remainingAmount}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, remainingAmount: e.target.value })}
                                />
                                <Input
                                    label="Remaining in Words / المتبقي كتابة"
                                    value={saleFormData.remainingAmountWords}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, remainingAmountWords: e.target.value })}
                                />
                                <Input
                                    label="Remaining Due Date / تاريخ استحقاق المتبقي"
                                    type="date"
                                    value={saleFormData.remainingDueDate}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, remainingDueDate: e.target.value })}
                                />
                                <Input
                                    label="Final Payment (OMR) / الدفعة النهائية"
                                    type="number"
                                    step="0.001"
                                    value={saleFormData.finalPaymentAmount}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, finalPaymentAmount: e.target.value })}
                                />
                                <Input
                                    label="Final Payment in Words / الدفعة النهائية كتابة"
                                    value={saleFormData.finalPaymentAmountWords}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, finalPaymentAmountWords: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Construction Timeline */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Construction Timeline - الجدول الزمني للبناء
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Start Date / تاريخ البدء"
                                    type="date"
                                    value={saleFormData.constructionStartDate}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, constructionStartDate: e.target.value })}
                                />
                                <Input
                                    label="End Date / تاريخ الانتهاء"
                                    type="date"
                                    value={saleFormData.constructionEndDate}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, constructionEndDate: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label="Notes / ملاحظات"
                                        value={saleFormData.notes}
                                        onChange={(e) => setSaleFormData({ ...saleFormData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signatures */}
                    <Card>
                        <CardContent className="p-4">
                            <h3 className="font-semibold mb-4 text-lg border-b pb-2">
                                Signatures - التوقيعات
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Seller Signature / توقيع البائع"
                                    value={saleFormData.sellerSignature}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, sellerSignature: e.target.value })}
                                />
                                <Input
                                    label="Buyer Signature / توقيع المشتري"
                                    value={saleFormData.buyerSignature}
                                    onChange={(e) => setSaleFormData({ ...saleFormData, buyerSignature: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Modal>

            {/* Delete Confirmation for Rental */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, contract: null })}
                onConfirm={handleDeleteConfirm}
                title={t("common.confirmDelete")}
                message={`${t("common.deleteConfirmMessage")} "${deleteConfirm.contract?.contractNumber}"?`}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
                loading={deleting}
            />

            {/* Delete Confirmation for Sale */}
            <ConfirmDialog
                isOpen={deleteSaleConfirm.isOpen}
                onClose={() => setDeleteSaleConfirm({ isOpen: false, contract: null })}
                onConfirm={handleDeleteSaleConfirm}
                title={t("common.confirmDelete")}
                message={`${t("common.deleteConfirmMessage")} "${deleteSaleConfirm.contract?.contractNumber}"?`}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
            />
        </PageContainer>
    );
}
