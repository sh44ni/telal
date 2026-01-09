import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// Generate project ID in PRJ-XXXX format
async function generateProjectId(): Promise<string> {
    const projects = await prisma.project.findMany({
        orderBy: { projectId: 'desc' },
        take: 1,
    });

    if (!projects || projects.length === 0) {
        return "PRJ-0001";
    }

    const lastProjectId = projects[0].projectId;
    const match = lastProjectId?.match(/PRJ-(\d+)/);
    const lastNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = lastNumber + 1;

    return `PRJ-${nextNumber.toString().padStart(4, "0")}`;
}

// GET /api/projects - Get all projects
export async function GET(request: NextRequest) {
    // Protect route
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    // Protect route
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    try {
        const body = await request.json();

        // Validation - required fields
        const errors: string[] = [];

        if (!body.name?.trim()) {
            errors.push("Project name is required");
        }
        if (!body.budget || body.budget <= 0) {
            errors.push("Budget must be greater than 0");
        }
        if (!body.startDate) {
            errors.push("Start date is required");
        }
        if (!body.endDate) {
            errors.push("End date is required");
        }

        // Validate dates
        if (body.startDate && body.endDate) {
            const startDate = new Date(body.startDate);
            const endDate = new Date(body.endDate);
            if (endDate <= startDate) {
                errors.push("End date must be after start date");
            }
        }

        if (errors.length > 0) {
            return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
        }

        // Generate project ID if not present
        const projectId = body.projectId || await generateProjectId();

        // Convert status to uppercase enum value if provided
        const status = body.status ? body.status.toUpperCase() : 'IN_PROGRESS';

        const project = await prisma.project.create({
            data: {
                projectId,
                name: body.name.trim(),
                description: body.description || '',
                budget: body.budget,
                spent: body.spent || 0,
                completion: body.completion || 0,
                status,
                startDate: new Date(body.startDate),
                endDate: new Date(body.endDate),
                costs: body.costs || { materials: 0, labor: 0, overhead: 0 },
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
