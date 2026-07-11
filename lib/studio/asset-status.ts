/* Dashboard asset status (FIX-04 §2.2). Derived, not stored, so it can
   never disagree with the underlying rows: a download wins, then an
   approval decision, then the awaiting state, else draft. */

export type AssetStatus = "DRAFT" | "AWAITING_APPROVAL" | "APPROVED" | "DOWNLOADED";

export function deriveAssetStatus(input: {
  anyDownloaded: boolean;
  anyApproved: boolean;
  anyPending: boolean;
}): AssetStatus {
  if (input.anyDownloaded) return "DOWNLOADED";
  if (input.anyApproved) return "APPROVED";
  if (input.anyPending) return "AWAITING_APPROVAL";
  return "DRAFT";
}

export const STATUS_LABEL: Record<AssetStatus, string> = {
  DRAFT: "Draft",
  AWAITING_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  DOWNLOADED: "Downloaded",
};
