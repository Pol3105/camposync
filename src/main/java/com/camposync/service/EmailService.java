package com.camposync.service;

public interface EmailService {

    /**
     * Envía el correo de invitación al destinatario.
     *
     * @param emailDestino correo del invitado
     * @param token        token único de la invitación
     * @param rolDestino   "ASESOR" o "AGRICULTOR"
     */
    void enviarCorreoInvitacion(String emailDestino, String token, String rolDestino);
}
