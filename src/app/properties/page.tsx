"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Textarea, Select, Badge, Tabs, useToast, Card, ConfirmDialog } from "@/components/ui";
import { usePropertiesStore, useProjectsStore } from "@/stores/dataStores";
import type { Property } from "@/types";
import { Plus, Building2, Grid, List, Eye, Bed, Bath, Maximize2, MapPin } from "lucide-react";
import { formatCurrency, normalizeStatus } from "@/lib/utils";

export default function PropertiesPage() {
    const { t } = useTranslation();
    const toast = useToast();
    const { items: properties, addItem, updateItem, deleteItem, fetchItems } = usePropertiesStore();

    // Fetch properties from API on component mount
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Get projects for the dropdown
    const { items: projects, fetchItems: fetchProjects } = useProjectsStore();
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; property: Property | null }>({
        isOpen: false,
        property: null,
    });
    const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");
    const [activeTab, setActiveTab] = useState("all");
    const [formData, setFormData] = useState({
        name: "",
        type: "apartment",
        status: "available",
        price: "",
        rentalPrice: "",
        area: "",
        bedrooms: "",
        bathrooms: "",
        location: "",
        address: "",
        description: "",
        projectId: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

    const tabs = [
        { id: "all", label: t("common.all"), count: properties.length },
        { id: "available", label: t("properties.available"), count: properties.filter(p => p.status === "available").length },
        { id: "rented", label: t("properties.rented"), count: properties.filter(p => p.status === "rented").length },
        { id: "sold", label: t("properties.sold"), count: properties.filter(p => p.status === "sold").length },
    ];

    const filteredProperties = activeTab === "all"
        ? properties
        : properties.filter(p => p.status === activeTab);

    const columns: Column<Property>[] = [
        { key: "name", label: t("common.name"), sortable: true },
        {
            key: "projectId",
            label: t("nav.projects"),
            render: (item) => {
                const project = projects.find((p) => p.id === item.projectId);
                return project?.name || "-";
            },
        },
        {
            key: "type",
            label: t("properties.propertyType"),
            render: (item) => t(`properties.${item.type}`),
        },
        {
            key: "price",
            label: t("properties.price"),
            sortable: true,
            render: (item) => formatCurrency(item.price),
        },
        {
            key: "area",
            label: t("properties.area"),
            render: (item) => `${item.area} ${t("properties.sqm")}`,
        },
        { key: "location", label: t("properties.location"), sortable: true },
        {
            key: "status",
            label: t("common.status"),
            render: (item) => {
                const normalizedStatus = normalizeStatus(item.status);
                const variants: Record<string, "success" | "warning" | "secondary" | "danger"> = {
                    available: "success",
                    rented: "warning",
                    sold: "secondary",
                    undermaintenance: "danger",
                    under_maintenance: "danger",
                };
                // Map normalized status to translation key
                const translationKey = normalizedStatus === "undermaintenance" ? "underMaintenance" : normalizedStatus;
                return <Badge variant={variants[normalizedStatus] || variants[item.status] || "secondary"}>
                    {t(`properties.${translationKey}`) || item.status}
                </Badge>;
            },
        },
    ];

    const handleOpenModal = (property?: Property) => {
        // Reset errors when opening modal
        setFormErrors({});
        setShakeFields({});

        if (property) {
            setEditingProperty(property);
            setFormData({
                name: property.name,
                type: property.type,
                status: property.status,
                price: property.price.toString(),
                rentalPrice: property.rentalPrice?.toString() || "",
                area: property.area.toString(),
                bedrooms: property.bedrooms?.toString() || "",
                bathrooms: property.bathrooms?.toString() || "",
                location: property.location,
                address: property.address,
                description: property.description,
                projectId: property.projectId || "",
            });
        } else {
            setEditingProperty(null);
            setFormData({
                name: "",
                type: "apartment",
                status: "available",
                price: "",
                rentalPrice: "",
                area: "",
                bedrooms: "",
                bathrooms: "",
                location: "",
                address: "",
                description: "",
                projectId: "",
            });
        }
        setIsModalOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {};

        if (!formData.projectId) errors.projectId = true;
        if (!formData.name.trim()) errors.name = true;
        if (!formData.location.trim()) errors.location = true;
        if (!formData.price || parseFloat(formData.price) <= 0) errors.price = true;
        if (!formData.area || parseFloat(formData.area) <= 0) errors.area = true;

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            // Trigger shake animation
            setShakeFields(errors);
            setTimeout(() => setShakeFields({}), 500);
            toast.error(t("common.fillRequiredFields", "Please fill all required fields"));
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const propertyData: Property = {
            id: editingProperty?.id || `prop-${Date.now()}`,
            propertyId: editingProperty?.propertyId || "", // Will be generated by API if empty
            name: formData.name,
            type: formData.type as Property["type"],
            status: formData.status as Property["status"],
            price: parseFloat(formData.price) || 0,
            rentalPrice: parseFloat(formData.rentalPrice) || undefined,
            area: parseFloat(formData.area) || 0,
            bedrooms: parseInt(formData.bedrooms) || undefined,
            bathrooms: parseInt(formData.bathrooms) || undefined,
            location: formData.location,
            address: formData.address,
            description: formData.description,
            projectId: formData.projectId || undefined,
            features: editingProperty?.features || [],
            images: editingProperty?.images || [],
            createdAt: editingProperty?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (editingProperty) {
            updateItem(editingProperty.id, propertyData);
            toast.success("Property updated successfully");
        } else {
            addItem(propertyData);
            toast.success("Property created successfully");
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (property: Property) => {
        setDeleteConfirm({ isOpen: true, property });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirm.property) {
            deleteItem(deleteConfirm.property.id);
            toast.success(t("common.success") + ": Property deleted");
        }
        setDeleteConfirm({ isOpen: false, property: null });
    };

    return (
        <PageContainer
            title={t("properties.title")}
            actions={
                <div className="flex items-center gap-2">
                    <div className="flex border border-border">
                        <button
                            className={`p-2.5 sm:p-2 touch-target ${viewMode === "table" ? "bg-muted" : "hover:bg-muted"}`}
                            onClick={() => setViewMode("table")}
                            aria-label="Table view"
                        >
                            <List size={18} />
                        </button>
                        <button
                            className={`p-2.5 sm:p-2 touch-target ${viewMode === "grid" ? "bg-muted" : "hover:bg-muted"}`}
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid view"
                        >
                            <Grid size={18} />
                        </button>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        <span className="hidden sm:inline">{t("properties.addProperty")}</span>
                        <span className="sm:hidden">Add</span>
                    </Button>
                </div>
            }
        >
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-4">
                {viewMode === "table" ? (
                    <DataTable
                        data={filteredProperties}
                        columns={columns}
                        keyField="id"
                        loading={properties.length === 0}
                        loadingLabel="Loading properties..."
                        onEdit={handleOpenModal}
                        onDelete={handleDeleteClick}
                        actions={(item) => (
                            <button
                                onClick={() => setViewingProperty(item)}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                title="View Details"
                            >
                                <Eye size={16} />
                            </button>
                        )}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProperties.map((property) => (
                            <Card key={property.id} hover onClick={() => handleOpenModal(property)}>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold">{property.name}</h3>
                                        <Badge variant={property.status === "available" ? "success" : "secondary"}>
                                            {t(`properties.${property.status}`)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{property.location}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-primary font-bold">{formatCurrency(property.price)}</span>
                                        <span className="text-sm text-muted-foreground">{property.area} {t("properties.sqm")}</span>
                                    </div>
                                    {property.bedrooms && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {property.bedrooms} {t("properties.bedrooms")} • {property.bathrooms} {t("properties.bathrooms")}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProperty ? t("common.edit") + " " + t("properties.title") : t("properties.addProperty")}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label={t("nav.projects") + " *"}
                        value={formData.projectId}
                        onChange={(e) => {
                            setFormData({ ...formData, projectId: e.target.value });
                            if (formErrors.projectId) setFormErrors({ ...formErrors, projectId: false });
                        }}
                        options={[
                            { value: "", label: t("common.select") + " " + t("nav.projects").toLowerCase() + "..." },
                            ...projects.map((project) => ({
                                value: project.id,
                                label: project.name,
                            })),
                        ]}
                        shake={shakeFields.projectId}
                    />
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
                        label={t("properties.propertyType")}
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        options={[
                            { value: "apartment", label: t("properties.apartment") },
                            { value: "villa", label: t("properties.villa") },
                            { value: "shop", label: t("properties.shop") },
                            { value: "office", label: t("properties.office") },
                            { value: "land", label: t("properties.land") },
                            { value: "warehouse", label: t("properties.warehouse") },
                        ]}
                    />
                    <Select
                        label={t("common.status")}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        options={[
                            { value: "available", label: t("properties.available") },
                            { value: "rented", label: t("properties.rented") },
                            { value: "sold", label: t("properties.sold") },
                            { value: "under_maintenance", label: t("properties.underMaintenance") },
                        ]}
                    />
                    <Input
                        label={t("properties.price") + " *"}
                        type="number"
                        value={formData.price}
                        onChange={(e) => {
                            setFormData({ ...formData, price: e.target.value });
                            if (formErrors.price) setFormErrors({ ...formErrors, price: false });
                        }}
                        shake={shakeFields.price}
                    />
                    <Input
                        label={t("rentals.monthlyRent")}
                        type="number"
                        value={formData.rentalPrice}
                        onChange={(e) => setFormData({ ...formData, rentalPrice: e.target.value })}
                    />
                    <Input
                        label={t("properties.area") + " * (" + t("properties.sqm") + ")"}
                        type="number"
                        value={formData.area}
                        onChange={(e) => {
                            setFormData({ ...formData, area: e.target.value });
                            if (formErrors.area) setFormErrors({ ...formErrors, area: false });
                        }}
                        shake={shakeFields.area}
                    />
                    <Input
                        label={t("properties.bedrooms")}
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    />
                    <Input
                        label={t("properties.bathrooms")}
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    />
                    <Input
                        label={t("properties.location") + " *"}
                        value={formData.location}
                        onChange={(e) => {
                            setFormData({ ...formData, location: e.target.value });
                            if (formErrors.location) setFormErrors({ ...formErrors, location: false });
                        }}
                        shake={shakeFields.location}
                    />
                    <div className="md:col-span-3">
                        <Input
                            label={t("common.address")}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <Textarea
                            label={t("common.description")}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, property: null })}
                onConfirm={handleDeleteConfirm}
                title={t("common.confirmDelete")}
                message={`${t("common.deleteConfirmMessage")} "${deleteConfirm.property?.name}"?`}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
            />

            {/* Property Details View Modal */}
            <Modal
                isOpen={!!viewingProperty}
                onClose={() => setViewingProperty(null)}
                title={viewingProperty?.name || t("properties.title")}
                size="md"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setViewingProperty(null)}>
                            {t("common.close")}
                        </Button>
                        <Button onClick={() => {
                            if (viewingProperty) {
                                handleOpenModal(viewingProperty);
                                setViewingProperty(null);
                            }
                        }}>
                            {t("common.edit")}
                        </Button>
                    </div>
                }
            >
                {viewingProperty && (
                    <div className="space-y-4">
                        {/* Property ID and Type */}
                        <div className="flex items-center justify-between pb-3 border-b">
                            <Badge variant={viewingProperty.status === "available" ? "success" : viewingProperty.status === "rented" ? "warning" : "secondary"}>
                                {t(`properties.${viewingProperty.status}`)}
                            </Badge>
                            <div className="text-right">
                                <span className="text-xs text-muted-foreground">ID: </span>
                                <span className="font-mono text-sm">{viewingProperty.propertyId || "-"}</span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{t("properties.location")}</p>
                                    <p className="font-medium">{viewingProperty.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Maximize2 size={16} className="text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">{t("properties.area")}</p>
                                    <p className="font-medium">{viewingProperty.area} {t("properties.sqm")}</p>
                                </div>
                            </div>
                            {viewingProperty.bedrooms !== undefined && (
                                <div className="flex items-center gap-2">
                                    <Bed size={16} className="text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("properties.bedrooms")}</p>
                                        <p className="font-medium">{viewingProperty.bedrooms}</p>
                                    </div>
                                </div>
                            )}
                            {viewingProperty.bathrooms !== undefined && (
                                <div className="flex items-center gap-2">
                                    <Bath size={16} className="text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t("properties.bathrooms")}</p>
                                        <p className="font-medium">{viewingProperty.bathrooms}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                            <div className="bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground">{t("properties.price")}</p>
                                <p className="text-lg font-bold">{formatCurrency(viewingProperty.price)}</p>
                            </div>
                            {viewingProperty.rentalPrice && (
                                <div className="bg-success/10 p-3">
                                    <p className="text-xs text-muted-foreground">{t("rentals.monthlyRent")}</p>
                                    <p className="text-lg font-bold text-success">{formatCurrency(viewingProperty.rentalPrice)}/mo</p>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {viewingProperty.description && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-1">{t("common.description")}</p>
                                <p className="text-sm">{viewingProperty.description}</p>
                            </div>
                        )}

                        {/* Address */}
                        {viewingProperty.address && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-1">{t("common.address")}</p>
                                <p className="text-sm">{viewingProperty.address}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </PageContainer>
    );
}
