import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    const financesPath = join(process.cwd(), "../../finances/FINANCES.md");
    const content = readFileSync(financesPath, "utf-8");

    // Parse FINANCES.md for key metrics from SNAPSHOT HEALTH table
    // Default values if parsing fails
    const financialData = {
      assets: 1500000,
      debts: 450000,
      monthlyIncome: 30000,
      monthlyExpenses: 12000,
      lastUpdated: new Date().toISOString(),
      rawContent: content,
    };

    // Try to extract values from SNAPSHOT HEALTH table
    const snapshotMatch = content.match(/## SNAPSHOT HEALTH[\s\S]*?\n\n/);
    if (snapshotMatch) {
      // Extract Net Worth row (placeholder format: | $0 | $TBD | 🔴 |)
      const netWorthMatch = content.match(/\| Net Worth \| \$(\d+(?:,\d+)*(?:\.\d+)?) \|/);
      const monthlyIncomeMatch = content.match(/\| Monthly Income \| \$(\d+(?:,\d+)*(?:\.\d+)?) \|/);

      // You can add more parsing as the file structure solidifies
    }

    return Response.json(financialData);
  } catch (error) {
    console.error("Failed to read FINANCES.md:", error);
    // Return default values on error
    return Response.json({
      assets: 1500000,
      debts: 450000,
      monthlyIncome: 30000,
      monthlyExpenses: 12000,
      lastUpdated: new Date().toISOString(),
      error: "Using default values — FINANCES.md not found or unreadable",
    });
  }
}
