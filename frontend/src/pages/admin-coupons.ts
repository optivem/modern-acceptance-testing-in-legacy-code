import { createCoupon, browseCoupons } from '../services/coupon-service';
import { showSuccessNotification, handleResult, showApiError } from '../common';
import type { BrowseCouponsItemResponse } from '../types/api.types';
import type { ApiError } from '../types/error.types';

// Load and display coupons
async function loadCoupons() {
  const result = await browseCoupons();
  handleResult(result, (response) => {
    displayCoupons(response.coupons);
  });
  
  if (!result.success) {
    const tbody = document.getElementById('couponTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Failed to load coupons</td></tr>';
    }
  }
}

function displayCoupons(coupons: BrowseCouponsItemResponse[]) {
  const tbody = document.getElementById('couponTableBody');
  if (!tbody) return;

  if (coupons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No coupons found</td></tr>';
    return;
  }

  const now = new Date();
  tbody.innerHTML = coupons.map(coupon => {
    const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null;
    const validTo = coupon.validTo ? new Date(coupon.validTo) : null;
    let status = 'Active';
    
    if (validFrom && now < validFrom) {
      status = 'Not Yet Valid';
    } else if (validTo && now > validTo) {
      status = 'Expired';
    } else if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      status = 'Limit Reached';
    }

    const usageLimitDisplay = coupon.usageLimit === null ? 'Unlimited' : (coupon.usageLimit === 2147483647 ? 'Unlimited' : coupon.usageLimit.toString());
    const validFromDisplay = validFrom ? validFrom.toLocaleString() : 'Immediate';
    const validToDisplay = validTo ? validTo.toLocaleString() : 'Never';
    return `
      <tr aria-label="Coupon Row">
        <td aria-label="Coupon Code Cell">${escapeHtml(coupon.code)}</td>
        <td aria-label="Discount Rate Cell">${(coupon.discountRate * 100).toFixed(2)}%</td>
        <td aria-label="Valid From Cell">${validFromDisplay}</td>
        <td aria-label="Valid To Cell">${validToDisplay}</td>
        <td aria-label="Usage Limit Cell">${usageLimitDisplay}</td>
        <td aria-label="Used Count Cell">${coupon.usedCount}</td>
        <td>${status}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle form submission
document.getElementById('createCouponForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);
  
  const code = formData.get('code') as string;
  const discountRateStr = formData.get('discountRate') as string;
  const validFromStr = formData.get('validFrom') as string;
  const validToStr = formData.get('validTo') as string;
  const usageLimitStr = formData.get('usageLimit') as string;

  // Client-side validation - collect field errors
  const fieldErrors: string[] = [];

  // Validate coupon code
  if (!code || !code.trim()) {
    fieldErrors.push('code: Coupon code must not be blank');
  }

  // Validate discount rate
  if (!discountRateStr) {
    fieldErrors.push('discountRate: Discount rate must not be null');
  } else {
    const discountRate = parseFloat(discountRateStr);
    
    // Validate discount rate range
    if (isNaN(discountRate)) {
      fieldErrors.push('discountRate: Discount rate must not be null');
    } else if (discountRate <= 0) {
      fieldErrors.push('discountRate: Discount rate must be greater than 0.00');
    } else if (discountRate > 1) {
      fieldErrors.push('discountRate: Discount rate must be at most 1.00');
    }
  }

  const usageLimit = usageLimitStr && usageLimitStr.trim().length > 0 ? parseInt(usageLimitStr) : null;
  
  // Validate usage limit
  if (usageLimit !== null && usageLimit <= 0) {
    fieldErrors.push('usageLimit: Usage limit must be positive');
  }

  // Show validation errors if any
  if (fieldErrors.length > 0) {
    const validationError: ApiError = {
      message: 'The request contains one or more validation errors',
      fieldErrors,
      status: 400
    };
    showApiError(validationError);
    return;
  }

  const discountRate = parseFloat(discountRateStr);

  // Convert datetime-local to ISO 8601 string, or null if not provided (empty string check)
  const validFrom = (validFromStr && validFromStr.trim().length > 0) ? new Date(validFromStr).toISOString() : null;
  const validTo = (validToStr && validToStr.trim().length > 0) ? new Date(validToStr).toISOString() : null;

  const result = await createCoupon(code, discountRate, validFrom, validTo, usageLimit);
  handleResult(result, () => {
    showSuccessNotification(`Coupon ${code} created successfully!`);
    form.reset();
    loadCoupons();
  });
});

// Handle refresh button
document.getElementById('refreshButton')?.addEventListener('click', async () => {
  await loadCoupons();
});

// Auto-generate coupon code on page load
const codeInput = document.getElementById('code') as HTMLInputElement;
if (codeInput) {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  codeInput.value = `SAVE${randomNum}`;
}

// Load coupons on page load
loadCoupons();
