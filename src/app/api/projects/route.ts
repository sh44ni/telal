import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/db";
import type { Project } from "@/types";

// GET /api/projects - Get all projects
export async function GET() {
    try {
        const data = readData();
        return NextResponse.json(data.projects);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    try {
        const project: Project = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!project.name?.trim()) {
            errors.push("Project name is required");
        }
        if (!project.budget || project.budget <= 0) {
            errors.push("Budget must be greater than 0");
        }
        if (!project.startDate) {
            errors.push("Start date is required");
        }
        if (!project.endDate) {
            errors.push("End date is required");
        }

        // Validate dates
        if (project.startDate && project.endDate) {
            const startDate = new Date(project.startDate);
            const endDate = new Date(project.endDate);
            if (endDate <= startDate) {
                errors.push("End date must be after start date");
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        const data = readData();

        // Ensure ID exists
        if (!project.id) {
            project.id = `proj-${Date.now()}`;
        }

        // Set timestamps
        const now = new Date().toISOString();
        project.createdAt = project.createdAt || now;
        project.updatedAt = now;

        // Set defaults
        project.spent = project.spent || 0;
        project.completion = project.completion || 0;
        project.costs = project.costs || { materials: 0, labor: 0, overhead: 0 };

        data.projects.push(project);
        writeData(data);

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
