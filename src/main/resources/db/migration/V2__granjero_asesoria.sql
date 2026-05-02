-- V2: vincula Granjero a Asesoria al aceptar una invitación
ALTER TABLE granjero ADD COLUMN asesoria_id BIGINT REFERENCES asesoria(id);
