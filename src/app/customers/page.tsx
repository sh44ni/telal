"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Textarea, Select, Badge, Tabs, useToast, ConfirmDialog } from "@/components/ui";
import { useCustomersStore, useRentalsStore, usePropertiesStore } from "@/stores/dataStores";
import type { Customer, Transaction, Property } from "@/types";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, normalizeStatus } from "@/lib/utils";

export default function CustomersPage() {
    const { t } = useTranslation();
    const toast = useToast();
    const { items: customers, addItem, updateItem, deleteItem, fetchItems } = useCustomersStore();
    const { fetchItems: fetchRentals } = useRentalsStore();
    const { fetchItems: fetchProperties } = usePropertiesStore();

    // Fetch customers from API on component mount
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
    const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
    const [customerProperties, setCustomerProperties] = useState<Property[]>([]);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; customer: Customer | null }>({
        isOpen: false,
        customer: null,
    });
    const [viewDeleteConfirm, setViewDeleteConfirm] = useState<{
        isOpen: boolean;
        customer: Customer | null;
        propertiesCount: number;
        transactionsCount: number;
    }>({
        isOpen: false,
        customer: null,
        propertiesCount: 0,
        transactionsCount: 0,
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
        { id: "tenant", label: t("customers.tenant"), count: customers.filter(c => normalizeStatus(c.type) === "tenant").length },
        { id: "buyer", label: t("customers.buyer"), count: customers.filter(c => normalizeStatus(c.type) === "buyer").length },
        { id: "lead", label: t("customers.lead"), count: customers.filter(c => normalizeStatus(c.type) === "lead").length },
        { id: "owner", label: t("customers.owner"), count: customers.filter(c => normalizeStatus(c.type) === "owner").length },
    ];

    const filteredCustomers = activeTab === "all"
        ? customers
        : customers.filter(c => normalizeStatus(c.type) === activeTab);

    const columns: Column<Customer>[] = [
        { key: "customerId", label: "Customer ID", sortable: true },
        { key: "name", label: t("common.name"), sortable: true },
        {
            key: "type",
            label: t("customers.customerType"),
            render: (item) => {
                const normalizedType = normalizeStatus(item.type);
                const variants: Record<string, "success" | "warning" | "secondary" | "default"> = {
                    tenant: "success",
                    buyer: "default",
                    lead: "warning",
                    owner: "secondary",
                };
                return <Badge variant={variants[normalizedType] || variants[item.type] || "default"}>
                    {t(`customers.${normalizedType}`) || item.type}
                </Badge>;
            },
        },
        { key: "email", label: t("common.email") },
        { key: "phone", label: t("common.phone") },
        { key: "nationality", label: "Nationality" },
    ];

    // Fetch customer details for view modal
    const fetchCustomerDetails = useCallback(async (customer: Customer) => {
        try {
            // Fetch transactions for this customer
            const transactionsRes = await fetch("/api/transactions");
            if (transactionsRes.ok) {
                const allTransactions = await transactionsRes.json();
                const customerTxns = allTransactions.filter((t: Transaction) => t.customerId === customer.id);
                setCustomerTransactions(customerTxns);
            }

            // Fetch properties
            const propertiesRes = await fetch("/api/properties");
            if (propertiesRes.ok) {
                const allProperties = await propertiesRes.json();
                const assignedProps = allProperties.filter((p: Property) =>
                    customer.assignedPropertyIds?.includes(p.id)
                );
                setCustomerProperties(assignedProps);
            }
        } catch (error) {
            console.error("Error fetching customer details:", error);
        }
    }, []);

    const handleViewDetails = (customer: Customer) => {
        setViewingCustomer(customer);
        fetchCustomerDetails(customer);
        setIsViewModalOpen(true);
    };

    const handleOpenModal = (customer?: Customer) => {
        setFormErrors({});
        setShakeFields({});

        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                type: normalizeStatus(customer.type) || customer.type,
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
            customerId: editingCustomer?.customerId || "", // Backend will auto-generate
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

    // Handle Edit Details from view modal
    const handleEditFromViewModal = () => {
        if (viewingCustomer) {
            setIsViewModalOpen(false);
            handleOpenModal(viewingCustomer);
        }
    };

    // Handle Delete from view modal - shows detailed warning
    const handleDeleteFromViewModal = () => {
        if (viewingCustomer) {
            setViewDeleteConfirm({
                isOpen: true,
                customer: viewingCustomer,
                propertiesCount: customerProperties.length,
                transactionsCount: customerTransactions.length,
            });
        }
    };

    // Confirm delete from view modal with cascade
    const handleViewDeleteConfirm = async () => {
        if (!viewDeleteConfirm.customer) return;

        try {
            const res = await fetch(`/api/customers/${viewDeleteConfirm.customer.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                const result = await res.json();
                toast.success(`${result.customerName} deleted successfully. ${result.deletedTransactions} transactions deleted, ${result.freedProperties} properties freed.`);

                // Refresh all related stores to sync data everywhere
                fetchItems();        // Refresh customers
                fetchRentals();      // Refresh rentals (some may have been deleted)
                fetchProperties();   // Refresh properties (statuses may have changed)

                // Close modals
                setViewDeleteConfirm({ isOpen: false, customer: null, propertiesCount: 0, transactionsCount: 0 });
                setIsViewModalOpen(false);
                setViewingCustomer(null);
            } else {
                toast.error("Failed to delete customer");
            }
        } catch (error) {
            toast.error("An error occurred while deleting customer");
        }
    };

    // Calculate total money received from transactions
    const totalMoneyReceived = customerTransactions
        .filter(t => t.category === "income")
        .reduce((sum, t) => sum + t.amount, 0);

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
                    loading={customers.length === 0}
                    loadingLabel="Loading customers..."
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteClick}
                    actions={(item) => (
                        <button
                            onClick={() => handleViewDetails(item)}
                            className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                            title="View Details"
                        >
                            <Eye size={16} />
                        </button>
                    )}
                />
            </div>

            {/* Create/Edit Customer Modal */}
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
                        label="ID Number"
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

            {/* View Details Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingCustomer(null);
                    setCustomerTransactions([]);
                    setCustomerProperties([]);
                }}
                title="Customer Details"
                size="lg"
                footer={
                    <div className="flex justify-between w-full">
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleEditFromViewModal}>
                                <Edit size={16} />
                                {t("common.edit")} Details
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteFromViewModal}>
                                <Trash2 size={16} />
                                Delete Customer
                            </Button>
                        </div>
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                            {t("common.close")}
                        </Button>
                    </div>
                }
            >
                {viewingCustomer && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <div className="text-xl font-semibold">{viewingCustomer.name}</div>
                                <div className="text-sm text-muted-foreground">{viewingCustomer.customerId || "ID not assigned"}</div>
                            </div>
                            <Badge variant={
                                viewingCustomer.type === "tenant" ? "success" :
                                    viewingCustomer.type === "buyer" ? "default" :
                                        viewingCustomer.type === "lead" ? "warning" : "secondary"
                            }>
                                {t(`customers.${viewingCustomer.type}`)}
                            </Badge>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Contact Information</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Phone:</span>
                                    <span className="ml-2 font-medium">{viewingCustomer.phone}</span>
                                </div>
                                {viewingCustomer.alternatePhone && (
                                    <div>
                                        <span className="text-muted-foreground">Alt Phone:</span>
                                        <span className="ml-2 font-medium">{viewingCustomer.alternatePhone}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="ml-2 font-medium">{viewingCustomer.email || "-"}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">Address:</span>
                                    <span className="ml-2 font-medium">{viewingCustomer.address || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* ID Documents */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">ID Documents</h4>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">ID Number:</span>
                                    <span className="ml-2 font-medium">{viewingCustomer.emiratesId || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Passport:</span>
                                    <span className="ml-2 font-medium">{viewingCustomer.passportNo || "-"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Nationality:</span>
                                    <span className="ml-2 font-medium">{viewingCustomer.nationality || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Assigned Properties */}
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Assigned Properties</h4>
                            {customerProperties.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {customerProperties.map(p => (
                                        <Badge key={p.id} variant="secondary">{p.name}</Badge>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">No properties assigned</span>
                            )}
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-muted/50 p-4 border">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Customer Since</div>
                                    <div className="font-medium">{formatDate(viewingCustomer.createdAt)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Total Money Received</div>
                                    <div className="font-semibold text-success">{formatCurrency(totalMoneyReceived)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {viewingCustomer.notes && (
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Notes</h4>
                                <p className="text-sm text-muted-foreground">{viewingCustomer.notes}</p>
                            </div>
                        )}
                    </div>
                )}
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

            {/* Special Delete Confirmation for View Modal */}
            <Modal
                isOpen={viewDeleteConfirm.isOpen}
                onClose={() => setViewDeleteConfirm({ isOpen: false, customer: null, propertiesCount: 0, transactionsCount: 0 })}
                title="⚠️ Delete Customer"
                size="md"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setViewDeleteConfirm({ isOpen: false, customer: null, propertiesCount: 0, transactionsCount: 0 })}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleViewDeleteConfirm}>
                            <Trash2 size={16} />
                            Delete Customer
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-foreground">
                        Are you sure you want to delete <strong>{viewDeleteConfirm.customer?.name}</strong>?
                    </p>

                    <div className="bg-destructive/10 border border-destructive/30 p-4 space-y-2">
                        <p className="text-sm font-semibold text-destructive">Warning: This action cannot be undone!</p>
                        <ul className="text-sm text-destructive/90 space-y-1 list-disc list-inside">
                            {viewDeleteConfirm.propertiesCount > 0 && (
                                <li>
                                    <strong>{viewDeleteConfirm.propertiesCount}</strong> property(s) currently rented will be marked as <strong>Available</strong>
                                </li>
                            )}
                            {viewDeleteConfirm.transactionsCount > 0 && (
                                <li>
                                    <strong>{viewDeleteConfirm.transactionsCount}</strong> transaction(s) associated with this customer will be <strong>deleted permanently</strong>
                                </li>
                            )}
                            <li>All rental agreements for this customer will be <strong>terminated</strong></li>
                        </ul>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        If you proceed, the customer&apos;s record and all associated data will be permanently removed from the system.
                    </p>
                </div>
            </Modal>
        </PageContainer>
    );
}
