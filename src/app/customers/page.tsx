"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Textarea, Select, Badge, Tabs, useToast, ConfirmDialog } from "@/components/ui";
import { useCustomersStore } from "@/stores/dataStores";
import type { Customer } from "@/types";
import { Plus, Users } from "lucide-react";

export default function CustomersPage() {
    const { t } = useTranslation();
    const toast = useToast();
    const { items: customers, addItem, updateItem, deleteItem, fetchItems } = useCustomersStore();

    // Fetch customers from API on component mount
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; customer: Customer | null }>({
        isOpen: false,
        customer: null,
    });
    const [activeTab, setActiveTab] = useState("all");
    const [formData, setFormData] = useState({
        name: "",
        type: "lead",
        email: "",
        phone: "",
        alternatePhone: "",
        address: "",
        emiratesId: "",
        passportNo: "",
        nationality: "",
        notes: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

    const tabs = [
        { id: "all", label: t("common.all"), count: customers.length },
        { id: "tenant", label: t("customers.tenant"), count: customers.filter(c => c.type === "tenant").length },
        { id: "buyer", label: t("customers.buyer"), count: customers.filter(c => c.type === "buyer").length },
        { id: "lead", label: t("customers.lead"), count: customers.filter(c => c.type === "lead").length },
        { id: "owner", label: t("customers.owner"), count: customers.filter(c => c.type === "owner").length },
    ];

    const filteredCustomers = activeTab === "all"
        ? customers
        : customers.filter(c => c.type === activeTab);

    const columns: Column<Customer>[] = [
        { key: "name", label: t("common.name"), sortable: true },
        {
            key: "type",
            label: t("customers.customerType"),
            render: (item) => {
                const variants: Record<string, "success" | "warning" | "secondary" | "default"> = {
                    tenant: "success",
                    buyer: "default",
                    lead: "warning",
                    owner: "secondary",
                };
                return <Badge variant={variants[item.type]}>{t(`customers.${item.type}`)}</Badge>;
            },
        },
        { key: "email", label: t("common.email") },
        { key: "phone", label: t("common.phone") },
        { key: "nationality", label: "Nationality" },
        {
            key: "assignedPropertyIds",
            label: t("customers.assignedProperties"),
            render: (item) => item.assignedPropertyIds.length || "-",
        },
    ];

    const handleOpenModal = (customer?: Customer) => {
        setFormErrors({});
        setShakeFields({});

        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                type: customer.type,
                email: customer.email,
                phone: customer.phone,
                alternatePhone: customer.alternatePhone || "",
                address: customer.address,
                emiratesId: customer.emiratesId || "",
                passportNo: customer.passportNo || "",
                nationality: customer.nationality || "",
                notes: customer.notes,
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: "",
                type: "lead",
                email: "",
                phone: "",
                alternatePhone: "",
                address: "",
                emiratesId: "",
                passportNo: "",
                nationality: "",
                notes: "",
            });
        }
        setIsModalOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {};

        if (!formData.name.trim()) errors.name = true;
        if (!formData.phone.trim()) errors.phone = true;

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            setShakeFields(errors);
            setTimeout(() => setShakeFields({}), 500);
            toast.error(t("common.fillRequiredFields", "Please fill all required fields"));
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const customerData: Customer = {
            id: editingCustomer?.id || `cust-${Date.now()}`,
            name: formData.name,
            type: formData.type as Customer["type"],
            email: formData.email,
            phone: formData.phone,
            alternatePhone: formData.alternatePhone || undefined,
            address: formData.address,
            emiratesId: formData.emiratesId || undefined,
            passportNo: formData.passportNo || undefined,
            nationality: formData.nationality || undefined,
            notes: formData.notes,
            assignedPropertyIds: editingCustomer?.assignedPropertyIds || [],
            createdAt: editingCustomer?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (editingCustomer) {
            updateItem(editingCustomer.id, customerData);
            toast.success("Customer updated successfully");
        } else {
            addItem(customerData);
            toast.success("Customer created successfully");
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (customer: Customer) => {
        setDeleteConfirm({ isOpen: true, customer });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirm.customer) {
            deleteItem(deleteConfirm.customer.id);
            toast.success(t("common.success") + ": Customer deleted");
        }
        setDeleteConfirm({ isOpen: false, customer: null });
    };

    return (
        <PageContainer
            title={t("customers.title")}
            actions={
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    {t("customers.addCustomer")}
                </Button>
            }
        >
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-4">
                <DataTable
                    data={filteredCustomers}
                    columns={columns}
                    keyField="id"
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteClick}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCustomer ? t("common.edit") + " " + t("customers.title") : t("customers.addCustomer")}
                size="xl"
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
                    <Input
                        label={t("common.name") + " *"}
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (formErrors.name) setFormErrors({ ...formErrors, name: false });
                        }}
                        shake={shakeFields.name}
                    />
                    <Select
                        label={t("customers.customerType")}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        options={[
                            { value: "lead", label: t("customers.lead") },
                            { value: "tenant", label: t("customers.tenant") },
                            { value: "buyer", label: t("customers.buyer") },
                            { value: "owner", label: t("customers.owner") },
                        ]}
                    />
                    <Input
                        label={t("common.email")}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Input
                        label={t("common.phone") + " *"}
                        value={formData.phone}
                        onChange={(e) => {
                            setFormData({ ...formData, phone: e.target.value });
                            if (formErrors.phone) setFormErrors({ ...formErrors, phone: false });
                        }}
                        shake={shakeFields.phone}
                    />
                    <Input
                        label="Alternate Phone"
                        value={formData.alternatePhone}
                        onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    />
                    <Input
                        label="Nationality"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    />
                    <Input
                        label="Emirates ID"
                        value={formData.emiratesId}
                        onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
                    />
                    <Input
                        label="Passport No."
                        value={formData.passportNo}
                        onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                    />
                    <div className="md:col-span-2">
                        <Input
                            label={t("common.address")}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Textarea
                            label={t("common.notes")}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, customer: null })}
                onConfirm={handleDeleteConfirm}
                title={t("common.confirmDelete")}
                message={`${t("common.deleteConfirmMessage")} "${deleteConfirm.customer?.name}"?`}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
            />
        </PageContainer>
    );
}
