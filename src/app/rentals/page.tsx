"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Select, Badge, useToast, Card, CardHeader, CardTitle, CardContent, ConfirmDialog } from "@/components/ui";
import { useRentalsStore, usePropertiesStore, useCustomersStore } from "@/stores/dataStores";
import type { Rental } from "@/types";
import { Plus, AlertTriangle, Mail, MoreVertical, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, normalizeStatus } from "@/lib/utils";
import { useRef, useEffect as useEffectRef } from "react";

export default function RentalsPage() {
    const { t } = useTranslation();
    const toast = useToast();
    const { items: rentals, addItem, updateItem, deleteItem, fetchItems: fetchRentals } = useRentalsStore();
    const { items: properties, fetchItems: fetchProperties } = usePropertiesStore();
    const { items: customers, fetchItems: fetchCustomers } = useCustomersStore();

    // Fetch all data from API on component mount
    useEffect(() => {
        fetchRentals();
        fetchProperties();
        fetchCustomers();
    }, [fetchRentals, fetchProperties, fetchCustomers]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRental, setEditingRental] = useState<Rental | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; rental: Rental | null }>({
        isOpen: false,
        rental: null,
    });
    const [formData, setFormData] = useState({
        propertyId: "",
        tenantId: "",
        monthlyRent: "",
        depositAmount: "",
        leaseStart: "",
        leaseEnd: "",
        dueDay: "1",
        notes: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});
    const [sendingReminder, setSendingReminder] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffectRef(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Check if rental is overdue
    const isOverdue = (rental: Rental) => {
        const paidUntil = new Date(rental.paidUntil);
        const today = new Date();
        return paidUntil < today;
    };

    // Get overdue rentals count
    const overdueCount = rentals.filter(r => r.paymentStatus === "overdue").length;

    const columns: Column<Rental>[] = [
        {
            key: "propertyId",
            label: t("rentals.property"),
            render: (item) => {
                // Use nested property data from API if available, otherwise fallback to properties array
                if (item.property) return item.property.name;
                return properties.find(p => p.id === item.propertyId)?.name || item.propertyId;
            },
        },
        {
            key: "tenantId",
            label: t("rentals.tenant"),
            render: (item) => {
                // Use nested tenant data from API if available, otherwise fallback to customers array
                if (item.tenant) return item.tenant.name;
                return customers.find(c => c.id === item.tenantId)?.name || item.tenantId;
            },
        },
        {
            key: "monthlyRent",
            label: t("rentals.monthlyRent"),
            sortable: true,
            render: (item) => formatCurrency(item.monthlyRent),
        },
        {
            key: "dueDay",
            label: t("rentals.dueDate"),
            render: (item) => `Day ${item.dueDay}`,
        },
        {
            key: "paidUntil",
            label: t("rentals.paidUntil"),
            render: (item) => formatDate(item.paidUntil),
        },
        {
            key: "paymentStatus",
            label: t("rentals.paymentStatus"),
            render: (item) => {
                const normalizedStatus = normalizeStatus(item.paymentStatus);
                const variants: Record<string, "success" | "warning" | "danger" | "secondary"> = {
                    paid: "success",
                    unpaid: "warning",
                    partiallypaid: "warning",
                    partially_paid: "warning",
                    overdue: "danger",
                };
                // Map normalized status to translation key
                const translationKey = normalizedStatus === "partiallypaid" ? "partiallyPaid" : normalizedStatus;
                return <Badge variant={variants[normalizedStatus] || variants[item.paymentStatus] || "secondary"}>
                    {t(`rentals.${translationKey}`) || item.paymentStatus}
                </Badge>;
            },
        },
        {
            key: "leaseEnd",
            label: t("rentals.leaseEnd"),
            render: (item) => formatDate(item.leaseEnd),
        },
    ];

    const handleOpenModal = (rental?: Rental) => {
        setFormErrors({});
        setShakeFields({});

        if (rental) {
            setEditingRental(rental);
            setFormData({
                propertyId: rental.propertyId,
                tenantId: rental.tenantId,
                monthlyRent: rental.monthlyRent.toString(),
                depositAmount: rental.depositAmount.toString(),
                leaseStart: rental.leaseStart,
                leaseEnd: rental.leaseEnd,
                dueDay: rental.dueDay.toString(),
                notes: rental.notes,
            });
        } else {
            setEditingRental(null);
            setFormData({
                propertyId: "",
                tenantId: "",
                monthlyRent: "",
                depositAmount: "",
                leaseStart: "",
                leaseEnd: "",
                dueDay: "1",
                notes: "",
            });
        }
        setIsModalOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {};

        if (!formData.propertyId) errors.propertyId = true;
        if (!formData.tenantId) errors.tenantId = true;
        if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) errors.monthlyRent = true;
        if (!formData.leaseStart) errors.leaseStart = true;
        if (!formData.leaseEnd) errors.leaseEnd = true;

        // Validate dates
        if (formData.leaseStart && formData.leaseEnd) {
            const start = new Date(formData.leaseStart);
            const end = new Date(formData.leaseEnd);
            if (end <= start) {
                errors.leaseEnd = true;
                toast.error("Lease end date must be after start date");
            }
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            setShakeFields(errors);
            setTimeout(() => setShakeFields({}), 500);
            if (!errors.leaseEnd || Object.keys(errors).length > 1) {
                toast.error(t("common.fillRequiredFields", "Please fill all required fields"));
            }
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const rentalData: Rental = {
            id: editingRental?.id || `rent-${Date.now()}`,
            rentalId: editingRental?.rentalId || "", // Will be generated by API if empty
            propertyId: formData.propertyId,
            tenantId: formData.tenantId,
            monthlyRent: parseFloat(formData.monthlyRent) || 0,
            depositAmount: parseFloat(formData.depositAmount) || 0,
            leaseStart: formData.leaseStart,
            leaseEnd: formData.leaseEnd,
            dueDay: parseInt(formData.dueDay) || 1,
            paymentStatus: editingRental?.paymentStatus || "unpaid",
            paidUntil: editingRental?.paidUntil || formData.leaseStart,
            notes: formData.notes,
            createdAt: editingRental?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (editingRental) {
            updateItem(editingRental.id, rentalData);
            toast.success("Rental updated successfully");
        } else {
            addItem(rentalData);
            toast.success("Rental created successfully");
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (rental: Rental) => {
        setDeleteConfirm({ isOpen: true, rental });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirm.rental) {
            const propertyName = properties.find(p => p.id === deleteConfirm.rental?.propertyId)?.name || "Rental";
            deleteItem(deleteConfirm.rental.id);
            toast.success(t("common.success") + ": Rental deleted");
        }
        setDeleteConfirm({ isOpen: false, rental: null });
    };

    const handleSendReminder = async (rental: Rental) => {
        const tenant = customers.find(c => c.id === rental.tenantId);
        if (!tenant?.email) {
            toast.error("Tenant has no email address");
            return;
        }

        setSendingReminder(rental.id);
        toast.info(`Sending reminder to ${tenant.email}...`);
        try {
            const response = await fetch("/api/send-payment-reminder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rentalId: rental.id }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Reminder sent to ${tenant.email}`);
            } else {
                toast.error(result.error || "Failed to send reminder");
            }
        } catch (error) {
            console.error("Error sending reminder:", error);
            toast.error("Failed to send reminder");
        } finally {
            setSendingReminder(null);
        }
    };

    const tenantOptions = customers
        .filter(c => {
            const normalizedType = normalizeStatus(c.type);
            return normalizedType === "tenant" || normalizedType === "lead";
        })
        .map(c => ({ value: c.id, label: c.name }));

    const propertyOptions = properties
        .filter(p => {
            const normalizedStatus = normalizeStatus(p.status);
            return normalizedStatus === "available" || (editingRental && p.id === editingRental.propertyId);
        })
        .map(p => ({ value: p.id, label: p.name }));

    return (
        <PageContainer
            title={t("rentals.title")}
            actions={
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    {t("rentals.addRental")}
                </Button>
            }
        >
            {/* Overdue Alert */}
            {overdueCount > 0 && (
                <Card className="mb-4 border-destructive bg-destructive/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertTriangle className="text-destructive" size={24} />
                        <div>
                            <p className="font-semibold text-destructive">{t("rentals.overdueAlert")}</p>
                            <p className="text-sm text-muted-foreground">
                                {overdueCount} rental(s) have overdue payments
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <DataTable
                data={rentals}
                columns={columns}
                keyField="id"
                actions={(item) => (
                    <div className="relative" ref={activeMenu === item.id ? menuRef : null}>
                        <button
                            onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                            className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {activeMenu === item.id && (
                            <div className="fixed z-[9999] bg-card border border-border shadow-lg min-w-[140px]"
                                style={{
                                    transform: 'translate(-100%, 0)',
                                    marginLeft: '24px',
                                    marginTop: '-8px'
                                }}>
                                <button
                                    onClick={() => {
                                        handleOpenModal(item);
                                        setActiveMenu(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                                >
                                    <Edit size={14} />
                                    {t("common.edit")}
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteClick(item);
                                        setActiveMenu(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left text-destructive"
                                >
                                    <Trash2 size={14} />
                                    {t("common.delete")}
                                </button>
                                {isOverdue(item) && (
                                    <button
                                        onClick={() => {
                                            handleSendReminder(item);
                                            setActiveMenu(null);
                                        }}
                                        disabled={sendingReminder === item.id}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left text-primary disabled:opacity-50"
                                    >
                                        <Mail size={14} className={sendingReminder === item.id ? "animate-spin" : ""} />
                                        {sendingReminder === item.id ? "Sending..." : "Send Reminder"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRental ? t("common.edit") + " " + t("rentals.title") : t("rentals.addRental")}
                size="lg"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSubmit}>{t("common.save")}</Button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label={t("rentals.property") + " *"}
                        value={formData.propertyId}
                        onChange={(e) => {
                            setFormData({ ...formData, propertyId: e.target.value });
                            if (formErrors.propertyId) setFormErrors({ ...formErrors, propertyId: false });
                        }}
                        options={propertyOptions}
                        placeholder="Select property"
                        shake={shakeFields.propertyId}
                    />
                    <Select
                        label={t("rentals.tenant") + " *"}
                        value={formData.tenantId}
                        onChange={(e) => {
                            setFormData({ ...formData, tenantId: e.target.value });
                            if (formErrors.tenantId) setFormErrors({ ...formErrors, tenantId: false });
                        }}
                        options={tenantOptions}
                        placeholder="Select tenant"
                        shake={shakeFields.tenantId}
                    />
                    <Input
                        label={t("rentals.monthlyRent") + " *"}
                        type="number"
                        value={formData.monthlyRent}
                        onChange={(e) => {
                            setFormData({ ...formData, monthlyRent: e.target.value });
                            if (formErrors.monthlyRent) setFormErrors({ ...formErrors, monthlyRent: false });
                        }}
                        shake={shakeFields.monthlyRent}
                    />
                    <Input
                        label={t("receipts.deposit")}
                        type="number"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                    />
                    <Input
                        label={t("rentals.leaseStart") + " *"}
                        type="date"
                        value={formData.leaseStart}
                        onChange={(e) => {
                            setFormData({ ...formData, leaseStart: e.target.value });
                            if (formErrors.leaseStart) setFormErrors({ ...formErrors, leaseStart: false });
                        }}
                        shake={shakeFields.leaseStart}
                    />
                    <Input
                        label={t("rentals.leaseEnd") + " *"}
                        type="date"
                        value={formData.leaseEnd}
                        onChange={(e) => {
                            setFormData({ ...formData, leaseEnd: e.target.value });
                            if (formErrors.leaseEnd) setFormErrors({ ...formErrors, leaseEnd: false });
                        }}
                        shake={shakeFields.leaseEnd}
                    />
                    <Select
                        label={t("rentals.dueDate") + " (Day of Month)"}
                        value={formData.dueDay}
                        onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                        options={Array.from({ length: 28 }, (_, i) => ({
                            value: (i + 1).toString(),
                            label: `Day ${i + 1}`,
                        }))}
                    />
                    <div className="md:col-span-2">
                        <Input
                            label={t("common.notes")}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, rental: null })}
                onConfirm={handleDeleteConfirm}
                title={t("common.confirmDelete")}
                message={`${t("common.deleteConfirmMessage")} rental for "${properties.find(p => p.id === deleteConfirm.rental?.propertyId)?.name || 'this property'}"?`}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
            />
        </PageContainer>
    );
}
