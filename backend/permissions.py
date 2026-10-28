"""Role-based permission middleware helper."""
from fastapi import Header, HTTPException
from typing import Optional

VALID_ROLES = {"creator", "manager", "reviewer", "admin"}

ROLE_PERMISSIONS = {
    "creator": {
        "submit", "view_own_submissions", "view_findings", "accept_finding",
        "dismiss_finding", "submit_for_review",
    },
    "manager": {
        "submit", "view_all_submissions", "view_findings", "comment",
        "request_changes", "approve", "reject", "submit_for_review",
        "accept_finding", "dismiss_finding",
    },
    "reviewer": {
        "view_all_submissions", "view_findings", "comment",
        "request_changes", "approve", "reject",
    },
    "admin": {
        "submit", "view_all_submissions", "view_findings", "comment",
        "request_changes", "approve", "reject", "manage_guidelines",
        "submit_for_review", "accept_finding", "dismiss_finding",
    },
}


def get_role(x_role: Optional[str] = Header(default="creator")) -> str:
    role = (x_role or "creator").lower().strip()
    if role not in VALID_ROLES:
        role = "creator"
    return role


def require_permission(role: str, permission: str) -> None:
    allowed = ROLE_PERMISSIONS.get(role, set())
    if permission not in allowed:
        raise HTTPException(
            status_code=403,
            detail=f"Role '{role}' does not have permission: {permission}",
        )
