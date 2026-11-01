const errorMessages: Record<string, string> = {
  "leave.insufficient_balance": "You don't have enough leave balance for this request.",
  "leave.overlap": "You already have leave approved for these dates.",
  "leave.notice_period": "Your request doesn't meet the required notice period.",
  "employee.duplicate_email": "An employee with this email already exists.",
  "employee.duplicate_number": "This employee number is already in use.",
  "auth.invalid_credentials": "Email or password is incorrect.",
  "auth.account_locked": "Too many attempts. Try again in 15 minutes.",
  "tenant.slug_taken": "This workspace URL is already taken.",
  "tenant.suspended": "This workspace has been suspended.",
};

export function getErrorMessage(code: string, fallback: string): string {
  return errorMessages[code] ?? fallback;
}
