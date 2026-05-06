-- Add rol_destino to support asesor invitations
ALTER TABLE invitacion ADD COLUMN IF NOT EXISTS rol_destino VARCHAR(20) NOT NULL DEFAULT 'AGRICULTOR';
