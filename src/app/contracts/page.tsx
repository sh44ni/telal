"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Select, Badge, Tabs, useToast, Card, CardContent, ConfirmDialog } from "@/components/ui";
import type { RentalContract, PaymentFrequency } from "@/types";
import { Plus, FileText, Download, Eye, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Initial form state
const initialFormData = {
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

export default function ContractsPage() {
    const { t } = useTranslation();
    const toast = useToast();

    // State
    const [contracts, setContracts] = useState<RentalContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<RentalContract | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const [formData, setFormData] = useState(initialFormData);
    const [generating, setGenerating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; contract: RentalContract | null }>({
        isOpen: false,
        contract: null,
    });
    const [deleting, setDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

    // Fetch contracts
    useEffect(() => {
        fetchContracts();
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

    const tabs = [
        { id: "all", label: t("common.all"), count: contracts.length },
        { id: "signed", label: t("contracts.signed"), count: contracts.filter(c => c.status === "signed").length },
        { id: "draft", label: t("contracts.draft"), count: contracts.filter(c => c.status === "draft").length },
        { id: "expired", label: t("contracts.expired"), count: contracts.filter(c => c.status === "expired").length },
    ];

    // Filter contracts
    const filteredContracts = contracts
        .filter(c => activeTab === "all" || c.status === activeTab)
        .filter(c =>
            !searchQuery ||
            c.contractNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.tenantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.landlordName?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const columns: Column<RentalContract>[] = [
        { key: "contractNumber", label: "Contract #", sortable: true },
        { key: "tenantName", label: "Tenant", sortable: true },
        { key: "landlordName", label: "Landlord", sortable: true },
        {
            key: "validFrom",
            label: "Period",
            render: (item) => `${formatDate(item.validFrom)} - ${formatDate(item.validTo)}`,
        },
        {
            key: "monthlyRent",
            label: "Monthly Rent",
            sortable: true,
            render: (item) => formatCurrency(item.monthlyRent),
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
            setFormData(initialFormData);
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

        // Validate dates
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

            // Save to database
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

                // Generate and download PDF using server-side Puppeteer
                try {
                    const pdfResponse = await fetch("/api/generate-pdf", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contract: savedContract }),
                    });

                    if (pdfResponse.ok) {
                        const blob = await pdfResponse.blob();
                        const pdfUrl = URL.createObjectURL(blob);

                        // Trigger download
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

    return (
        <PageContainer
            title={t("contracts.title")}
            actions={
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    {t("contracts.addContract")}
                </Button>
            }
        >
            {/* Search */}
            <div className="mb-4">
                <Input
                    placeholder="Search by Contract #, Tenant, or Landlord..."
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
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteClick}
                    actions={(item) => (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleDownloadPDF(item)}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                title="Download PDF"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteClick(item)}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Contract Form Modal */}
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

            {/* Delete Confirmation */}
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
        </PageContainer>
    );
}
