export class UserError extends Error {}

export const statusFor = (e: unknown) => (e instanceof UserError ? 400 : 502);
