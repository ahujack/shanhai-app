export type MembershipTier = 'free' | 'premium' | 'vip';

export function membershipExpiryDate(user: { membershipExpiryAt?: string | Date | null } | null | undefined): Date | null {
  if (!user?.membershipExpiryAt) return null;
  const d = new Date(user.membershipExpiryAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isMembershipActive(
  user: { membership?: string; membershipExpiryAt?: string | Date | null } | null | undefined,
): boolean {
  if (!user) return false;
  const tierEnabled = user.membership === 'vip' || user.membership === 'premium';
  if (!tierEnabled) return false;
  const exp = membershipExpiryDate(user);
  if (!exp) return true;
  return exp.getTime() > Date.now();
}

export function getMembershipLabel(
  user: { membership?: string; membershipExpiryAt?: string | Date | null } | null | undefined,
): string {
  if (!user) return '免费用户';
  const active = isMembershipActive(user);
  if (user.membership === 'vip') return active ? 'VIP会员' : 'VIP（已过期）';
  if (user.membership === 'premium') return active ? '高级会员' : '高级会员（已过期）';
  return '免费用户';
}
