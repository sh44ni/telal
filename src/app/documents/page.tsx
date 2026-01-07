"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout";
import { Button, DataTable, Column, Modal, Input, Select, Badge, Tabs, useToast, Card, CardContent, ConfirmDialog } from "@/components/ui";
import type { Document, DocumentCategory } from "@/types";
import { Plus, Upload, FileText, Download, Trash2, FolderOpen, File, Image, FileSpreadsheet, Search, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
    const { t } = useTranslation();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [uploading, setUploading] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        category: "other" as DocumentCategory,
        uploadDate: new Date().toISOString().split("T")[0],
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; document: Document | null }>({
        isOpen: false,
        document: null,
    });
    const [deleting, setDeleting] = useState(false);

    // Fetch documents from API
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await fetch("/api/documents");
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Failed to fetch documents:", error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "all", label: t("common.all"), count: documents.length },
        { id: "contracts", label: t("documents.contracts"), count: documents.filter(d => d.category === "contracts").length },
        { id: "receipts", label: t("documents.receipts"), count: documents.filter(d => d.category === "receipts").length },
        { id: "identities", label: t("documents.identities"), count: documents.filter(d => d.category === "identities").length },
        { id: "property", label: t("documents.property"), count: documents.filter(d => d.category === "property").length },
        { id: "other", label: t("documents.other"), count: documents.filter(d => d.category === "other").length },
    ];

    // Filter documents by tab and search
    const filteredDocuments = documents
        .filter(d => activeTab === "all" || d.category === activeTab)
        .filter(d =>
            !searchQuery ||
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const getFileIcon = (fileType: string) => {
        if (fileType.includes("pdf")) return <FileText size={16} className="text-destructive" />;
        if (fileType.includes("image")) return <Image size={16} className="text-success" />;
        if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet size={16} className="text-success" />;
        return <File size={16} className="text-muted-foreground" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const columns: Column<Document>[] = [
        {
            key: "name",
            label: t("documents.fileName"),
            sortable: true,
            render: (item) => (
                <div className="flex items-center gap-2">
                    {getFileIcon(item.fileType)}
                    <span className="truncate max-w-[200px]">{item.name}</span>
                </div>
            ),
        },
        {
            key: "category",
            label: t("documents.category"),
            render: (item) => (
                <Badge variant="secondary">{t(`documents.${item.category}`)}</Badge>
            ),
        },
        {
            key: "fileSize",
            label: t("documents.fileSize"),
            render: (item) => formatFileSize(item.fileSize),
        },
        {
            key: "uploadDate",
            label: t("documents.uploadDate"),
            sortable: true,
            render: (item) => formatDate(item.uploadDate),
        },
    ];

    const handleOpenModal = () => {
        setFormData({
            name: "",
            category: "other",
            uploadDate: new Date().toISOString().split("T")[0],
        });
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Auto-fill name from filename if empty
            if (!formData.name) {
                setFormData({ ...formData, name: file.name });
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            toast.error("Please select a file to upload");
            return;
        }

        setUploading(true);

        try {
            // Step 1: Upload file
            const uploadFormData = new FormData();
            uploadFormData.append("file", selectedFile);

            const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: uploadFormData,
            });

            if (!uploadResponse.ok) {
                throw new Error("File upload failed");
            }

            const uploadResult = await uploadResponse.json();

            // Step 2: Create document record
            const documentData: Partial<Document> = {
                name: formData.name || selectedFile.name,
                category: formData.category,
                fileType: uploadResult.fileType,
                fileSize: uploadResult.fileSize,
                fileUrl: uploadResult.fileUrl,
                uploadDate: formData.uploadDate,
            };

            const docResponse = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(documentData),
            });

            if (docResponse.ok) {
                toast.success("Document uploaded successfully");
                fetchDocuments();
                setIsModalOpen(false);
            } else {
                throw new Error("Failed to save document record");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (document: Document) => {
        // Create download link
        const link = window.document.createElement("a");
        link.href = document.fileUrl;
        link.download = document.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        toast.success(`Downloading: ${document.name}`);
    };

    const handleDeleteClick = (document: Document) => {
        setDeleteConfirm({ isOpen: true, document });
    };

    const handleDeleteConfirm = async () => {
        const document = deleteConfirm.document;
        if (!document) return;

        setDeleting(true);
        try {
            // Delete from database
            await fetch(`/api/documents/${document.id}`, { method: "DELETE" });

            // Delete physical file (extract filename from URL)
            const fileName = document.fileUrl.split("/").pop();
            if (fileName) {
                await fetch("/api/upload", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fileName }),
                });
            }

            toast.success("Document deleted");
            fetchDocuments();
        } catch (error) {
            toast.error("Failed to delete document");
        } finally {
            setDeleting(false);
        }

        setDeleteConfirm({ isOpen: false, document: null });
    };

    return (
        <PageContainer
            title={t("documents.title")}
            actions={
                <Button onClick={handleOpenModal}>
                    <Upload size={18} />
                    {t("documents.uploadDocument")}
                </Button>
            }
        >
            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                        className="pl-10 pr-10"
                        placeholder="Search documents by name or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Drag and Drop Zone */}
            <Card className="mb-4 sm:mb-6 border-dashed border-2 hover:border-primary transition-colors cursor-pointer" onClick={handleOpenModal}>
                <CardContent className="p-4 sm:p-8 text-center">
                    <FolderOpen size={36} className="mx-auto text-muted-foreground mb-3 sm:mb-4 sm:w-12 sm:h-12" />
                    <p className="text-sm sm:text-base text-muted-foreground">{t("documents.dragDrop")}</p>
                    <p className="text-xs text-muted-foreground mt-1 sm:mt-2">PDF, Images, Documents (Max 10MB)</p>
                </CardContent>
            </Card>

            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="mt-4">
                <DataTable
                    data={filteredDocuments}
                    columns={columns}
                    keyField="id"
                    onDelete={handleDeleteClick}
                    actions={(item) => (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleDownload(item)}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                title={t("common.download")}
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteClick(item)}
                                className="p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                                title={t("common.delete")}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t("documents.uploadDocument")}
                size="md"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={uploading}>
                            {t("common.cancel")}
                        </Button>
                        <Button onClick={handleSubmit} loading={uploading} disabled={!selectedFile}>
                            <Upload size={16} />
                            {uploading ? "Uploading..." : t("common.upload")}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* File Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Select File *</label>
                        <div
                            className="border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {selectedFile ? (
                                <div className="flex items-center justify-center gap-2">
                                    {getFileIcon(selectedFile.type)}
                                    <span className="text-sm">{selectedFile.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({formatFileSize(selectedFile.size)})
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className="mx-auto text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Click to select file</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        />
                    </div>

                    {/* Document Name */}
                    <Input
                        label="Document Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter document name..."
                    />

                    {/* Category */}
                    <Select
                        label={t("documents.category")}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentCategory })}
                        options={[
                            { value: "contracts", label: t("documents.contracts") },
                            { value: "receipts", label: t("documents.receipts") },
                            { value: "identities", label: t("documents.identities") },
                            { value: "property", label: t("documents.property") },
                            { value: "other", label: t("documents.other") },
                        ]}
                    />

                    {/* Upload Date */}
                    <Input
                        label="Document Date"
                        type="date"
                        value={formData.uploadDate}
                        onChange={(e) => setFormData({ ...formData, uploadDate: e.target.value })}
                    />
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, document: null })}
                onConfirm={handleDeleteConfirm}
                title={t("common.confirmDelete")}
                message={`${t("common.deleteConfirmMessage")} "${deleteConfirm.document?.name}"?`}
                confirmText={t("common.delete")}
                cancelText={t("common.cancel")}
                variant="destructive"
                loading={deleting}
            />
        </PageContainer>
    );
}
