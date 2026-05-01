import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

interface BatchMemberRow {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  status?: string;
  familyGroup?: string;
}

const VALID_STATUSES = ["member", "visitor", "members_class", "inactive"];

function parseCSV(text: string): BatchMemberRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const requiredHeaders = ["firstName", "lastName"];
  for (const req of requiredHeaders) {
    if (!headers.includes(req)) {
      throw new Error(`Missing required column: ${req}`);
    }
  }

  const rows: BatchMemberRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").trim();
    });

    if (!row.firstName || !row.lastName) {
      throw new Error(`Row ${i + 1}: firstName and lastName are required`);
    }

    if (row.status && !VALID_STATUSES.includes(row.status)) {
      throw new Error(
        `Row ${i + 1}: invalid status "${row.status}". Valid: ${VALID_STATUSES.join(", ")}`
      );
    }

    rows.push({
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone || undefined,
      address: row.address || undefined,
      status: row.status || "member",
      familyGroup: row.familyGroup || undefined,
    });
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "append";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return Response.json({ error: "File must be a .csv" }, { status: 400 });
    }

    const text = await file.text();
    let rows: BatchMemberRow[];

    try {
      rows = parseCSV(text);
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Invalid CSV format" },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return Response.json({ error: "CSV file is empty (no data rows)" }, { status: 400 });
    }

    // If mode is "replace", clear existing data
    if (mode === "replace") {
      await prisma.attendance.deleteMany();
      await prisma.attendanceRecord.deleteMany();
      await prisma.member.deleteMany();
      await prisma.family.deleteMany();
    }

    // Group by family
    const familyGroups = new Map<string, BatchMemberRow[]>();
    const noFamily: BatchMemberRow[] = [];

    for (const row of rows) {
      if (row.familyGroup) {
        const group = familyGroups.get(row.familyGroup) || [];
        group.push(row);
        familyGroups.set(row.familyGroup, group);
      } else {
        noFamily.push(row);
      }
    }

    let created = 0;
    let familiesCreated = 0;

    // Create members with family groups
    for (const [familyName, members] of familyGroups) {
      // Check if family already exists (for append mode)
      let family = await prisma.family.findFirst({ where: { name: familyName } });
      if (!family) {
        family = await prisma.family.create({ data: { name: familyName } });
        familiesCreated++;
      }

      for (const member of members) {
        await prisma.member.create({
          data: {
            firstName: member.firstName,
            lastName: member.lastName,
            phone: member.phone || null,
            address: member.address || null,
            status: member.status || "member",
            familyId: family.id,
          },
        });
        created++;
      }
    }

    // Create members without family
    for (const member of noFamily) {
      await prisma.member.create({
        data: {
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone || null,
          address: member.address || null,
          status: member.status || "member",
          familyId: null,
        },
      });
      created++;
    }

    return Response.json({
      success: true,
      summary: {
        membersCreated: created,
        familiesCreated,
        totalRows: rows.length,
        mode,
      },
    });
  } catch (e) {
    console.error("Batch upload error:", e);
    return Response.json(
      { error: "Internal server error during batch upload" },
      { status: 500 }
    );
  }
}
