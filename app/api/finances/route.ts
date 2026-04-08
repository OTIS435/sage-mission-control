import { readFileSync } from "fs";
import { join } from "path";

function parseAmount(str: string): number {
  return parseInt(str.replace(/[^0-9]/g, ""), 10);
}

export async function GET() {
  try {
    const financesPath = "/Users/sageopenclaw/.openclaw/workspace/finances/FINANCES.md";
    const content = readFileSync(financesPath, "utf-8");

    // Default values
    const financialData = {
      assets: 4021656,
      debts: 1932480,
      netWorth: 2089176,
      monthlyIncome: 30000,
      monthlyExpenses: 25600,
      debtRatio: 47.4,
      emergencyFund: 14357,
      creditCards: 25660.66,
      lastUpdated: new Date().toISOString(),
    };

    // Parse SNAPSHOT HEALTH table
    const assetMatch = content.match(/\| \*\*Total Assets\*\* \| \$(\d+(?:,\d+)*) \|/);
    if (assetMatch) {
      financialData.assets = parseAmount(assetMatch[1]);
    }

    const debtMatch = content.match(/\| \*\*Total Liabilities\*\* \| \$(\d+(?:,\d+)*) \|/);
    if (debtMatch) {
      financialData.debts = parseAmount(debtMatch[1]);
    }

    const netWorthMatch = content.match(/\| \*\*Net Worth\*\* \| \$(\d+(?:,\d+)*) \|/);
    if (netWorthMatch) {
      financialData.netWorth = parseAmount(netWorthMatch[1]);
    }

    const monthlyIncomeMatch = content.match(/\| \*\*Monthly Income\*\* \| \$(\d+(?:,\d+)*) \|/);
    if (monthlyIncomeMatch) {
      financialData.monthlyIncome = parseAmount(monthlyIncomeMatch[1]);
    }

    const debtRatioMatch = content.match(/\| \*\*Debt Ratio\*\* \| ([\d.]+)% \|/);
    if (debtRatioMatch) {
      financialData.debtRatio = parseFloat(debtRatioMatch[1]);
    }

    const emergencyMatch = content.match(/\| \*\*Emergency Fund\*\* \| \$(\d+(?:,\d+)*) \|/);
    if (emergencyMatch) {
      financialData.emergencyFund = parseAmount(emergencyMatch[1]);
    }

    return Response.json(financialData);
  } catch (error) {
    console.error("Failed to read FINANCES.md:", error);
    return Response.json({
      assets: 4021656,
      debts: 1932480,
      netWorth: 2089176,
      monthlyIncome: 30000,
      monthlyExpenses: 25600,
      debtRatio: 47.4,
      emergencyFund: 14357,
      creditCards: 25660.66,
      lastUpdated: new Date().toISOString(),
      error: "Failed to parse FINANCES.md, using hardcoded April 7 values",
    });
  }
}
