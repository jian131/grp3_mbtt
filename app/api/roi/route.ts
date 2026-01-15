// Next.js API Route - Mock ROI Calculator
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const monthlyRent = Number(body.monthly_rent || body.monthlyRent) || 50;
  const productPrice = Number(body.product_price || body.productPrice) || 50000;
  const profitMargin = Number(body.profit_margin || body.profitMargin) || 0.3;
  const dailyCustomers = Number(body.target_daily_customers || body.dailyCustomers) || 100;
  const operatingCost = Number(body.operating_cost || body.operatingCost) || 10;

  // Calculate
  const monthlyRentVND = monthlyRent * 1000000;
  const operatingCostVND = operatingCost * 1000000;
  const profitPerItem = productPrice * profitMargin;
  const dailyProfit = profitPerItem * dailyCustomers;
  const monthlyRevenue = dailyProfit * 30;
  const totalMonthlyCost = monthlyRentVND + operatingCostVND;
  const monthlyNetProfit = monthlyRevenue - totalMonthlyCost;
  const breakEvenDays = totalMonthlyCost > 0 ? Math.ceil(totalMonthlyCost / dailyProfit) : 0;
  const roiPercent = totalMonthlyCost > 0 ? ((monthlyNetProfit / totalMonthlyCost) * 100).toFixed(1) : "0";

  let viability = 'excellent';
  if (breakEvenDays > 25) viability = 'risky';
  else if (breakEvenDays > 20) viability = 'moderate';
  else if (breakEvenDays > 15) viability = 'good';

  return NextResponse.json({
    success: true,
    inputs: {
      monthly_rent_million: monthlyRent,
      product_price_vnd: productPrice,
      profit_margin: profitMargin,
      daily_customers: dailyCustomers,
      operating_cost_million: operatingCost
    },
    results: {
      daily_profit_vnd: Math.round(dailyProfit),
      monthly_revenue_vnd: Math.round(monthlyRevenue),
      total_monthly_cost_vnd: Math.round(totalMonthlyCost),
      monthly_net_profit_vnd: Math.round(monthlyNetProfit),
      break_even_days: breakEvenDays,
      roi_percent: parseFloat(roiPercent),
      viability
    }
  });
}
