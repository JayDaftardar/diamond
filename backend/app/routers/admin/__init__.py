"""Admin API. Every router except login is protected on the server by `require_admin`;
every state-changing request must also come from an allowed origin."""

from fastapi import APIRouter, Depends

from app.routers.admin import auth, dashboard, departments, doctors, submissions, treatments
from app.security.deps import no_store, require_admin, require_same_origin

router = APIRouter(
    prefix="/api/v1/admin", dependencies=[Depends(no_store), Depends(require_same_origin)]
)

# Login/logout/me: login is open (it is the door), `me` checks the session itself.
router.include_router(auth.router)

# Everything below needs a valid admin session.
protected = APIRouter(dependencies=[Depends(require_admin)])
for module in (dashboard, submissions, treatments, doctors, departments):
    protected.include_router(module.router)
router.include_router(protected)
