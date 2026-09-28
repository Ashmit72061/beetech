-- Provenance events are the human-readable records committed by ledger receipts.
-- Corrections must append a compensating event rather than rewrite recorded history.
CREATE FUNCTION prevent_provenance_event_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ProvenanceEvent is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER provenance_event_append_only
BEFORE UPDATE OR DELETE ON "ProvenanceEvent"
FOR EACH ROW EXECUTE FUNCTION prevent_provenance_event_mutation();
