"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Textarea, Select, Badge, useToast, ConfirmDialog } from "@/components/ui";
import { useProjectsStore } from "@/stores/dataStores";
import type { Project } from "@/types";
import { Plus, FolderKanban } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProjectsPage() {
    const { t } = useTranslation();
    const toast = useToast();
    const { items: projects, addItem, updateItem, deleteItem, fetchItems } = useProjectsStore();

    // Fetch projects from API on component mount
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; project: Project | null }>({
        isOpen: false,
        project: null,
    });
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        budget: "",
        status: "in_progress",
        startDate: "",
        endDate: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

    const columns: Column<Project>[] = [
        { key: "name", label: t("projects.projectName"), sortable: true },
        {
            key: "budget",
            label: t("projects.budget"),
            sortable: true,
            render: (item) => formatCurrency(item.budget),
        },
        {
            key: "spent",
            label: t("projects.spent"),
            render: (item) => formatCurrency(item.spent),
        },
        {
            key: "completion",
            label: t("projects.completion"),
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${item.completion}%` }}
                        />
                    </div>
                    <span className="text-sm">{item.completion}%</span>
                </div>
            ),
        },
        {
            key: "status",
            label: t("common.status"),
            render: (item) => {
                const variants: Record<string, "success" | "warning" | "secondary" | "danger"> = {
                    in_progress: "warning",
                    completed: "success",
                    on_hold: "secondary",
                    cancelled: "danger",
                };
                return (
                    <Badge variant={variants[item.status] || "secondary"}>
                        {t(`projects.${item.status === "in_progress" ? "inProgress" : item.status}`)}
                    </Badge>
                );
            },
        },
        {
            key: "timeline",
            label: t("projects.timeline"),
            render: (item) => `${item.startDate} - ${item.endDate}`,
        },
    ];

    const handleOpenModal = (project?: Project) => {
        setFormErrors({});
        setShakeFields({});

        if (project) {
            setEditingProject(project);
            setFormData({
                name: project.name,
                description: project.description,
                budget: project.budget.toString(),
                status: project.status,
                startDate: project.startDate,
                endDate: project.endDate,
            });
        } else {
            setEditingProject(null);
            setFormData({
                name: "",
                description: "",
                budget: "",
                status: "in_progress",
                startDate: "",
                endDate: "",
            });
        }
        setIsModalOpen(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {};

        if (!formData.name.trim()) errors.name = true;
        if (!formData.budget || parseFloat(formData.budget) <= 0) errors.budget = true;
        if (!formData.startDate) errors.startDate = true;
        if (!formData.endDate) errors.endDate = true;

        // Validate dates
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (end <= start) {
                errors.endDate = true;
                toast.error("End date must be after start date");
            }
        }

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            setShakeFields(errors);
            setTimeout(() => setShakeFields({}), 500);
            if (!errors.endDate || Object.keys(errors).length > 1) {
                toast.error(t("common.fillRequiredFields", "Please fill all required fields"));
            }
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        const projectData = {
            id: editingProject?.id || `proj-${Date.now()}`,
            name: formData.name,
            description: formData.description,
            budget: parseFloat(formData.budget) || 0,
            spent: editingProject?.spent || 0,
            completion: editingProject?.completion || 0,
            status: formData.status as Project["status"],
            startDate: formData.startDate,
            endDate: formData.endDate,
            costs: editingProject?.costs || { materials: 0, labor: 0, overhead: 0 },
            createdAt: editingProject?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (editingProject) {
            updateItem(editingProject.id, projectData);
            toast.success(t("common.success") + ": Project updated");
        } else {
            addItem(projectData);
            toast.success(t("common.success") + ": Project created");
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (project: Project) => {
        setDeleteConfirm({ isOpen: true, project });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirm.project) {
            deleteItem(deleteConfirm.project.id);
            toast.success(t("common.success") + ": Project deleted");
        }
        setDeleteConfirm({ isOpen: false, project: null });
    };

    return (
        <PageContainer
            title={t("projects.title")}
            actions={
                <Button onClick={() => handleOpenModal()}>
                    <Plus size={18} />
                    {t("projects.addProject")}
                </Button>
            }
        >
            <DataTable
                data={projects}
                columns={columns}
                keyField="id"
                onEdit={handleOpenModal}
                onDelete={handleDeleteClick}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProject ? t("common.edit") + " " + t("projects.title") : t("projects.addProject")}
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
                    <Input
                        label={t("projects.projectName") + " *"}
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (formErrors.name) setFormErrors({ ...formErrors, name: false });
                        }}
                        shake={shakeFields.name}
                    />
                    <Input
                        label={t("projects.budget") + " *"}
                        type="number"
                        value={formData.budget}
                        onChange={(e) => {
                            setFormData({ ...formData, budget: e.target.value });
                            if (formErrors.budget) setFormErrors({ ...formErrors, budget: false });
                        }}
                        shake={shakeFields.budget}
                    />
                    <Input
                        label={t("projects.startDate") + " *"}
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => {
                            setFormData({ ...formData, startDate: e.target.value });
                            if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: false });
                        }}
                        shake={shakeFields.startDate}
                    />
                    <Input
                        label={t("projects.endDate") + " *"}
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => {
                            setFormData({ ...formData, endDate: e.target.value });
                            if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: false });
                        }}
                        shake={shakeFields.endDate}
                    />
                    <Select
                        label={t("common.status")}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        options={[
                            { value: "in_progress", label: t("projects.inProgress") },
                            { value: "completed", label: t("common.completed") },
                            { value: "on_hold", label: t("projects.onHold") },
                        ]}
                    />
                    <div className="md:col-span-2">
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
                onClose={() => setDeleteConfirm({ isOpen: false, project: null })}
                onConfirm={handleDeleteConfirm}
                title={t("common.confirmDelete")}
                message={`${t("common.deleteConfirmMessage")} "${deleteConfirm.project?.name}"?`}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
            />
        </PageContainer>
    );
}
