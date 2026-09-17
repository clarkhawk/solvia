-- An invoice reference is unique within an organization. This is the final
-- guard against duplicate imports and concurrent import requests.
CREATE UNIQUE INDEX "invoices_organization_id_reference_key"
ON "invoices"("organization_id", "reference");
